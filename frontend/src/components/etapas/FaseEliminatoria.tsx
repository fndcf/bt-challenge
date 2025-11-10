import React, { useState, useEffect } from "react";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "../../types/chave";
import chaveService from "../../services/chaveService";
import etapaService from "../../services/etapaService";
import { ModalRegistrarResultadoEliminatorio } from "./ModalRegistrarResultadoEliminatorio";

interface FaseEliminatoriaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
}

/**
 * Componente da Fase Eliminatória
 * Mostra confrontos com opção de lista ou bracket visual
 */
export const FaseEliminatoria: React.FC<FaseEliminatoriaProps> = ({
  etapaId,
  arenaId,
  grupos,
}) => {
  const [confrontos, setConfrontos] = useState<ConfrontoEliminatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ============== VALIDAÇÃO DOS GRUPOS ==============
  const todosGruposCompletos = React.useMemo(() => {
    if (!grupos || grupos.length === 0) return false;
    return grupos.every((g) => g.completo);
  }, [grupos]);

  // ============== NOVO: Validação para grupo único ==============
  const isGrupoUnico = React.useMemo(() => {
    return grupos && grupos.length === 1;
  }, [grupos]);
  // ==============================================================

  const partidasPendentes = React.useMemo(() => {
    if (!grupos) return 0;
    return grupos.reduce((total, g) => {
      return total + (g.totalPartidas - g.partidasFinalizadas);
    }, 0);
  }, [grupos]);

  // ============== DEBUG: Ver estado dos grupos ==============
  useEffect(() => {
    console.log("📊 GRUPOS RECEBIDOS NA ELIMINATÓRIA:", grupos);
    console.log("📊 Quantidade de grupos:", grupos?.length || 0);

    if (grupos && grupos.length > 0) {
      grupos.forEach((g, i) => {
        console.log(`   Grupo ${i + 1} (${g.nome}):`, {
          completo: g.completo,
          partidasFinalizadas: g.partidasFinalizadas,
          totalPartidas: g.totalPartidas,
        });
      });
    }

    console.log("✅ Todos grupos completos?", todosGruposCompletos);
    console.log("🎯 Partidas pendentes:", partidasPendentes);
  }, [grupos, todosGruposCompletos, partidasPendentes]);
  // ==========================================================

  const [confrontoSelecionado, setConfrontoSelecionado] =
    useState<ConfrontoEliminatorio | null>(null);
  const [visualizacao, setVisualizacao] = useState<"lista" | "bracket">(
    "lista"
  );
  const [faseAtual, setFaseAtual] = useState<TipoFase | "todas">("todas");

  // ============== VERIFICAR SE FINAL FOI FINALIZADA ==============
  const finalFinalizada = React.useMemo(() => {
    if (!confrontos || confrontos.length === 0) return false;

    const confrontoFinal = confrontos.find((c) => c.fase === TipoFase.FINAL);

    if (!confrontoFinal) return false;

    return confrontoFinal.status === StatusConfrontoEliminatorio.FINALIZADA;
  }, [confrontos]);

  console.log("🏆 Final finalizada?", finalFinalizada);
  // ==============================================================

  useEffect(() => {
    carregarConfrontos();
  }, [etapaId, faseAtual]);

  const carregarConfrontos = async () => {
    try {
      setLoading(true);
      setErro(null);

      const fase = faseAtual === "todas" ? undefined : faseAtual;
      const dados = await chaveService.buscarConfrontosEliminatorios(
        etapaId,
        fase
      );

      console.log("📊 Confrontos recebidos:", dados);
      console.log("📊 Quantidade:", dados?.length || 0);

      setConfrontos(dados);
    } catch (err: any) {
      console.error("Erro ao carregar confrontos:", err);
      setErro(err.message || "Erro ao carregar confrontos");
    } finally {
      setLoading(false);
    }
  };

  const gerarEliminatoria = async () => {
    if (!confirm("Gerar fase eliminatória? Esta ação não pode ser desfeita!")) {
      return;
    }

    try {
      setLoading(true);
      await chaveService.gerarFaseEliminatoria(etapaId, 2);

      // Aguardar um momento para o Firestore sincronizar
      console.log("⏳ Aguardando sincronização...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("✅ Fase eliminatória gerada com sucesso!");
      await carregarConfrontos();
    } catch (err: any) {
      console.error("Erro ao gerar eliminatória:", err);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============== NOVO: CANCELAR ELIMINATÓRIA ==============
  const cancelarEliminatoria = async () => {
    if (
      !confirm(
        "⚠️ ATENÇÃO!\n\n" +
          "Cancelar a fase eliminatória irá:\n" +
          "• Excluir TODOS os confrontos eliminatórios\n" +
          "• Excluir TODAS as partidas da eliminatória\n" +
          "• Permitir ajustar resultados da fase de grupos\n" +
          "• Permitir gerar a eliminatória novamente\n\n" +
          "Esta ação NÃO pode ser desfeita!\n\n" +
          "Deseja continuar?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await chaveService.cancelarFaseEliminatoria(etapaId);

      alert(
        "✅ Fase eliminatória cancelada!\n\n" +
          "Você pode agora:\n" +
          "• Ajustar resultados da fase de grupos\n" +
          "• Gerar a eliminatória novamente"
      );

      await carregarConfrontos();
    } catch (err: any) {
      console.error("Erro ao cancelar eliminatória:", err);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // ========================================================

  // ============== NOVO: ENCERRAR ETAPA ==============
  const encerrarEtapa = async () => {
    if (
      !confirm(
        "🏆 Encerrar Etapa?\n\n" +
          "Isso irá marcar a etapa como finalizada.\n" +
          "O campeão foi definido!\n\n" +
          "Deseja continuar?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      // Aqui você pode chamar um método do service para encerrar a etapa
      await etapaService.encerrarEtapa(etapaId);

      alert("✅ Etapa encerrada com sucesso! 🏆");

      // Recarregar ou redirecionar
      window.location.reload();
    } catch (err: any) {
      console.error("Erro ao encerrar etapa:", err);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // ==================================================

  const getNomeFase = (fase: TipoFase): string => {
    const nomes = {
      [TipoFase.OITAVAS]: "Oitavas de Final",
      [TipoFase.QUARTAS]: "Quartas de Final",
      [TipoFase.SEMIFINAL]: "Semifinal",
      [TipoFase.FINAL]: "Final",
    };
    return nomes[fase] || fase;
  };

  const getStatusBadge = (status: StatusConfrontoEliminatorio) => {
    const badges = {
      [StatusConfrontoEliminatorio.BYE]: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
          🎖️ BYE
        </span>
      ),
      [StatusConfrontoEliminatorio.AGENDADA]: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
          ⏳ Aguardando
        </span>
      ),
      [StatusConfrontoEliminatorio.FINALIZADA]: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
          ✅ Finalizada
        </span>
      ),
    };
    return badges[status];
  };

  const agruparPorFase = () => {
    const grupos: Record<TipoFase, ConfrontoEliminatorio[]> = {
      [TipoFase.OITAVAS]: [],
      [TipoFase.QUARTAS]: [],
      [TipoFase.SEMIFINAL]: [],
      [TipoFase.FINAL]: [],
    };

    // Verificar se confrontos existe e é array
    if (confrontos && Array.isArray(confrontos)) {
      confrontos.forEach((c) => {
        grupos[c.fase].push(c);
      });
    }

    return grupos;
  };

  const contarStatus = (fase: ConfrontoEliminatorio[]) => {
    const finalizados = fase.filter(
      (c) =>
        c.status === StatusConfrontoEliminatorio.FINALIZADA ||
        c.status === StatusConfrontoEliminatorio.BYE
    ).length;
    return `${finalizados}/${fase.length}`;
  };

  if (loading && (!confrontos || confrontos.length === 0)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">❌ {erro}</p>
          <button
            onClick={carregarConfrontos}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!confrontos || confrontos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Fase Eliminatória
          </h3>

          {/* ============== NOVO: VERIFICAR GRUPO ÚNICO PRIMEIRO ============== */}
          {isGrupoUnico ? (
            // ============== MENSAGEM PARA GRUPO ÚNICO ==============
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="text-5xl mb-3">🏆</div>
                <h4 className="text-xl font-bold text-green-800 mb-3">
                  Grupo Único - Campeão Definido!
                </h4>
                <p className="text-green-700 mb-4">
                  Com apenas 1 grupo, todos os jogadores já se enfrentaram no
                  sistema <strong>Todos contra Todos</strong>.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-300">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong className="text-green-700">Sistema:</strong>{" "}
                    Round-Robin (Todos contra Todos)
                  </p>
                  <p className="text-sm text-gray-700">
                    O <strong className="text-green-700">1º colocado</strong> do
                    grupo é automaticamente o{" "}
                    <strong className="text-green-700">CAMPEÃO</strong>! 🥇
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 Para ter fase eliminatória, configure a etapa com 2 ou mais
                grupos
              </p>
            </>
          ) : !todosGruposCompletos ? (
            // ============== PARTIDAS PENDENTES (SEU CÓDIGO ORIGINAL) ==============
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-semibold mb-2">
                  ⚠️ Finalize todas as partidas da fase de grupos primeiro
                </p>
                <p className="text-yellow-700 text-sm">
                  Ainda há {partidasPendentes} partida(s) pendente(s) nos
                  grupos.
                  <br />
                  Complete todos os jogos para gerar a fase eliminatória.
                </p>
              </div>
              <button
                disabled
                className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-semibold"
                title="Complete todas as partidas dos grupos primeiro"
              >
                🔒 Gerar Fase Eliminatória
              </button>
            </>
          ) : (
            // ============== PRONTO PARA GERAR (SEU CÓDIGO ORIGINAL) ==============
            <>
              <p className="text-gray-600 mb-6">
                A fase de grupos foi concluída! Gere a fase eliminatória para
                continuar o torneio.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={gerarEliminatoria}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  🚀 Gerar Fase Eliminatória
                </button>
                <button
                  onClick={carregarConfrontos}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50"
                >
                  🔄 Recarregar
                </button>
              </div>
            </>
          )}
          {/* ================================================================= */}
        </div>
      </div>
    );
  }

  const confrontosPorFase = agruparPorFase();
  const fasesComConfrontos = Object.entries(confrontosPorFase).filter(
    ([_, c]) => c && c.length > 0
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">🏆 Fase Eliminatória</h2>
        <p className="text-blue-100">Confrontos mata-mata até o campeão!</p>
      </div>

      {/* ============== BOTÕES DE AÇÃO ============== */}
      <div className="flex gap-3">
        {/* Botão Cancelar - só aparece se final NÃO foi finalizada */}
        {!finalFinalizada && (
          <button
            onClick={cancelarEliminatoria}
            disabled={loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Cancelar Eliminatória</span>
          </button>
        )}

        {/* Botão Encerrar - só aparece se final foi finalizada */}
        {finalFinalizada && (
          <button
            onClick={encerrarEtapa}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            <span>🏁</span>
            <span>Encerrar Etapa 🏆</span>
          </button>
        )}
      </div>
      {/* ============================================ */}

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Toggle visualização */}
        <div className="flex gap-2">
          <button
            onClick={() => setVisualizacao("lista")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              visualizacao === "lista"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setVisualizacao("bracket")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              visualizacao === "bracket"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🌳 Bracket
          </button>
        </div>

        {/* Filtro de fase */}
        <select
          value={faseAtual}
          onChange={(e) => setFaseAtual(e.target.value as TipoFase | "todas")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todas">Todas as Fases</option>
          {fasesComConfrontos.map(([fase]) => (
            <option key={fase} value={fase}>
              {getNomeFase(fase as TipoFase)}
            </option>
          ))}
        </select>

        {/* Botão atualizar */}
        <button
          onClick={carregarConfrontos}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          🔄 Atualizar
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ {erro}
        </div>
      )}

      {/* Conteúdo */}
      {visualizacao === "lista" ? (
        <VisualizacaoLista
          confrontosPorFase={confrontosPorFase}
          fasesComConfrontos={fasesComConfrontos}
          getNomeFase={getNomeFase}
          getStatusBadge={getStatusBadge}
          contarStatus={contarStatus}
          setConfrontoSelecionado={setConfrontoSelecionado}
        />
      ) : (
        <VisualizacaoBracket
          confrontosPorFase={confrontosPorFase}
          getNomeFase={getNomeFase}
          getStatusBadge={getStatusBadge}
          setConfrontoSelecionado={setConfrontoSelecionado}
        />
      )}

      {/* Modal de registro/edição de resultado */}
      {confrontoSelecionado && (
        <ModalRegistrarResultadoEliminatorio
          confronto={confrontoSelecionado}
          onClose={() => setConfrontoSelecionado(null)}
          onSuccess={() => {
            setConfrontoSelecionado(null);
            carregarConfrontos();
          }}
        />
      )}
    </div>
  );
};

/**
 * Visualização em Lista
 */
const VisualizacaoLista: React.FC<{
  confrontosPorFase: Record<TipoFase, ConfrontoEliminatorio[]>;
  fasesComConfrontos: [string, ConfrontoEliminatorio[]][];
  getNomeFase: (fase: TipoFase) => string;
  getStatusBadge: (status: StatusConfrontoEliminatorio) => JSX.Element;
  contarStatus: (fase: ConfrontoEliminatorio[]) => string;
  setConfrontoSelecionado: (confronto: ConfrontoEliminatorio) => void;
}> = ({
  confrontosPorFase,
  fasesComConfrontos,
  getNomeFase,
  getStatusBadge,
  contarStatus,
  setConfrontoSelecionado,
}) => {
  return (
    <div className="space-y-6">
      {fasesComConfrontos.map(([fase, confrontos]) => (
        <div key={fase} className="bg-white rounded-lg shadow-md p-6">
          {/* Header da fase */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              📍 {getNomeFase(fase as TipoFase)}
            </h3>
            <span className="text-sm font-semibold text-gray-600">
              {contarStatus(confrontos)} completos
            </span>
          </div>

          {/* Lista de confrontos */}
          <div className="space-y-4">
            {confrontos.map((confronto) => (
              <div
                key={confronto.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">
                    CONFRONTO {confronto.ordem}
                  </span>
                  {getStatusBadge(confronto.status)}
                </div>

                {/* Confronto BYE */}
                {confronto.status === StatusConfrontoEliminatorio.BYE ? (
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-green-700 mb-1">
                      {confronto.dupla1Nome}
                    </div>
                    <div className="text-sm text-green-600">
                      {confronto.dupla1Origem}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-green-700">
                      🎖️ Classificado automaticamente (BYE)
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Dupla 1 */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span
                          className={`font-medium ${
                            confronto.vencedoraId === confronto.dupla1Id
                              ? "text-green-600 font-bold"
                              : "text-gray-700"
                          }`}
                        >
                          {confronto.dupla1Nome}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({confronto.dupla1Origem})
                        </span>
                      </div>
                      {confronto.status ===
                        StatusConfrontoEliminatorio.FINALIZADA &&
                        confronto.placar && (
                          <span className="text-lg font-bold text-gray-900">
                            {confronto.placar.split("-")[0]}
                          </span>
                        )}
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center my-2">
                      <span className="text-xs text-gray-400 font-medium">
                        VS
                      </span>
                    </div>

                    {/* Dupla 2 */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span
                          className={`font-medium ${
                            confronto.vencedoraId === confronto.dupla2Id
                              ? "text-green-600 font-bold"
                              : "text-gray-700"
                          }`}
                        >
                          {confronto.dupla2Nome}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({confronto.dupla2Origem})
                        </span>
                      </div>
                      {confronto.status ===
                        StatusConfrontoEliminatorio.FINALIZADA &&
                        confronto.placar && (
                          <span className="text-lg font-bold text-gray-900">
                            {confronto.placar.split("-")[1]}
                          </span>
                        )}
                    </div>

                    {/* Resultado/Ações */}
                    {confronto.status ===
                    StatusConfrontoEliminatorio.FINALIZADA ? (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-600">🏆 Vencedor:</span>
                            <span className="font-bold text-green-600 ml-2">
                              {confronto.vencedoraNome}
                            </span>
                          </div>
                          <button
                            onClick={() => setConfrontoSelecionado(confronto)}
                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfrontoSelecionado(confronto)}
                        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📝</span>
                        <span>Registrar Resultado</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Visualização em Bracket (árvore)
 */
const VisualizacaoBracket: React.FC<{
  confrontosPorFase: Record<TipoFase, ConfrontoEliminatorio[]>;
  getNomeFase: (fase: TipoFase) => string;
  getStatusBadge: (status: StatusConfrontoEliminatorio) => JSX.Element;
  setConfrontoSelecionado: (confronto: ConfrontoEliminatorio) => void;
}> = ({
  confrontosPorFase,
  getNomeFase,
  getStatusBadge,
  setConfrontoSelecionado,
}) => {
  const fases = [
    TipoFase.OITAVAS,
    TipoFase.QUARTAS,
    TipoFase.SEMIFINAL,
    TipoFase.FINAL,
  ].filter((f) => confrontosPorFase[f].length > 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
      <div className="flex gap-8 min-w-max">
        {fases.map((fase) => (
          <div key={fase} className="flex flex-col gap-4 min-w-[250px]">
            {/* Título da fase */}
            <div className="text-center font-bold text-gray-900 pb-2 border-b-2 border-blue-600">
              {getNomeFase(fase)}
            </div>

            {/* Confrontos da fase */}
            <div className="space-y-4 flex-1 flex flex-col justify-around">
              {confrontosPorFase[fase].map((confronto) => (
                <div
                  key={confronto.id}
                  className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (confronto.status !== StatusConfrontoEliminatorio.BYE) {
                      setConfrontoSelecionado(confronto);
                    }
                  }}
                >
                  {/* Status */}
                  <div className="flex justify-center mb-2">
                    {getStatusBadge(confronto.status)}
                  </div>

                  {/* BYE */}
                  {confronto.status === StatusConfrontoEliminatorio.BYE ? (
                    <div className="text-center">
                      <div className="font-bold text-green-700 text-sm">
                        {confronto.dupla1Nome}
                      </div>
                      <div className="text-xs text-green-600 mt-1">BYE</div>
                    </div>
                  ) : (
                    <>
                      {/* Dupla 1 */}
                      <div className="flex items-center justify-between py-1">
                        <span
                          className={`text-sm ${
                            confronto.vencedoraId === confronto.dupla1Id
                              ? "font-bold text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          {confronto.dupla1Nome?.split("&")[0].trim()}
                        </span>
                        {confronto.placar && (
                          <span className="font-bold text-sm">
                            {confronto.placar.split("-")[0]}
                          </span>
                        )}
                      </div>

                      {/* Separador */}
                      <div className="border-t border-gray-300 my-1"></div>

                      {/* Dupla 2 */}
                      <div className="flex items-center justify-between py-1">
                        <span
                          className={`text-sm ${
                            confronto.vencedoraId === confronto.dupla2Id
                              ? "font-bold text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          {confronto.dupla2Nome?.split("&")[0].trim()}
                        </span>
                        {confronto.placar && (
                          <span className="font-bold text-sm">
                            {confronto.placar.split("-")[1]}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Campeão */}
        {confrontosPorFase[TipoFase.FINAL].length > 0 &&
          confrontosPorFase[TipoFase.FINAL][0].status ===
            StatusConfrontoEliminatorio.FINALIZADA && (
            <div className="flex flex-col gap-4 min-w-[250px]">
              <div className="text-center font-bold text-gray-900 pb-2 border-b-2 border-yellow-500">
                🏆 CAMPEÃO
              </div>
              <div className="flex-1 flex items-center">
                <div className="w-full border-4 border-yellow-500 rounded-lg p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="font-bold text-xl text-yellow-700">
                      {confrontosPorFase[TipoFase.FINAL][0].vencedoraNome}
                    </div>
                    <div className="text-sm text-yellow-600 mt-2">
                      Placar final:{" "}
                      {confrontosPorFase[TipoFase.FINAL][0].placar}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
