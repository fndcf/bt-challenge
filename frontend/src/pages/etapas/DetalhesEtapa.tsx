import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Etapa, Inscricao, StatusEtapa } from "../../types/etapa";
import etapaService from "../../services/etapaService";
import chaveService from "../../services/chaveService";
import { StatusBadge } from "../../components/etapas/StatusBadge";
import { ModalInscricao } from "../../components/etapas/ModalInscricao";
import { ChavesEtapa } from "../../components/etapas/ChavesEtapa";
import { ConfirmacaoPerigosa } from "../../components/ConfirmacaoPerigosa";
import { FaseEliminatoria } from "../../components/etapas/FaseEliminatoria";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de detalhes da etapa
 */
export const DetalhesEtapa: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalInscricaoAberto, setModalInscricaoAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // ==================== NOVO: Sistema de Abas ====================
  const [abaAtiva, setAbaAtiva] = useState<
    "visao-geral" | "inscricoes" | "chaves"
  >("visao-geral");
  // ===============================================================

  useEffect(() => {
    carregarEtapa();
  }, [id]);

  const carregarEtapa = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("ID da etapa não informado");
        return;
      }

      const data = await etapaService.buscarPorId(id);
      setEtapa(data);

      // Carregar inscrições
      await carregarInscricoes(id);
    } catch (err: any) {
      console.error("Erro ao carregar etapa:", err);
      setError(err.message || "Erro ao carregar etapa");
    } finally {
      setLoading(false);
    }
  };

  const carregarInscricoes = async (etapaId: string) => {
    try {
      const data = await etapaService.listarInscricoes(etapaId);
      setInscricoes(data);
    } catch (err: any) {
      console.error("Erro ao carregar inscrições:", err);
      setInscricoes([]);
    }
  };

  const handleCancelarInscricao = async (
    inscricaoId: string,
    jogadorNome: string
  ) => {
    if (!etapa) return;

    console.log(`🔄 Cancelando inscrição de ${jogadorNome}...`);
    console.log(`📋 Dados:`, { inscricaoId, etapaId: etapa.id });

    if (!confirm(`Deseja cancelar a inscrição de ${jogadorNome}?`)) {
      console.log("❌ Usuário cancelou a operação");
      return;
    }

    try {
      console.log("📡 Chamando API para cancelar...");
      await etapaService.cancelarInscricao(etapa.id, inscricaoId);
      console.log("✅ API retornou sucesso!");

      // Recarregar dados
      console.log("🔄 Recarregando dados da etapa...");
      await carregarEtapa();
      console.log("✅ Dados recarregados!");

      alert("Inscrição cancelada com sucesso!");
    } catch (err: any) {
      console.error("❌ Erro ao cancelar inscrição:", err);
      alert(err.message || "Erro ao cancelar inscrição");
    }
  };

  const handleEditar = () => {
    if (!etapa) return;
    navigate(`/admin/etapas/${etapa.id}/editar`);
  };

  const handleExcluir = async () => {
    if (!etapa) return;

    const confirmar = confirm(
      `⚠️ ATENÇÃO: Deseja realmente excluir a etapa "${etapa.nome}"?\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.deletar(etapa.id);
      alert("Etapa excluída com sucesso!");
      navigate("/admin/etapas");
    } catch (err: any) {
      console.error("Erro ao excluir etapa:", err);
      alert(err.message || "Erro ao excluir etapa");
      setLoading(false);
    }
  };

  const formatarData = (data: any) => {
    try {
      // Se for um Timestamp do Firebase
      if (data && typeof data === "object" && "_seconds" in data) {
        const date = new Date(data._seconds * 1000);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }

      // Se for string ISO
      if (typeof data === "string") {
        return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
      }

      // Se for Date
      if (data instanceof Date) {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }

      return "Data inválida";
    } catch (error) {
      return "Data inválida";
    }
  };

  const calcularProgresso = () => {
    if (!etapa || etapa.maxJogadores === 0) return 0;
    return Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100);
  };

  const handleInscreverJogador = () => {
    setModalInscricaoAberto(true);
  };

  const handleInscricaoSuccess = async () => {
    await carregarEtapa(); // Recarregar dados após inscrição
  };

  const handleGerarChaves = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🎾 Deseja gerar as chaves para a etapa "${etapa.nome}"?\n\n` +
        `Isso criará:\n` +
        `• ${etapa.qtdGrupos} grupos\n` +
        `• ${Math.floor(etapa.totalInscritos / 2)} duplas\n` +
        `• Todos os confrontos da fase de grupos\n\n` +
        `⚠️ Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      console.log("🎾 Iniciando geração de chaves...");

      const resultado = await chaveService.gerarChaves(etapa.id);

      console.log("✅ Chaves geradas com sucesso!", resultado);
      console.log(`📊 ${resultado.duplas.length} duplas criadas`);
      console.log(`📊 ${resultado.grupos.length} grupos criados`);
      console.log(`📊 ${resultado.partidas.length} partidas geradas`);

      alert(
        `✅ Chaves geradas com sucesso!\n\n` +
          `• ${resultado.duplas.length} duplas criadas\n` +
          `• ${resultado.grupos.length} grupos formados\n` +
          `• ${resultado.partidas.length} partidas agendadas`
      );

      // Recarregar etapa para ver as mudanças
      await carregarEtapa();

      // Mudar para aba de chaves
      setAbaAtiva("chaves");
    } catch (err: any) {
      console.error("❌ Erro ao gerar chaves:", err);
      alert(err.message || "Erro ao gerar chaves");
    } finally {
      setLoading(false);
    }
  };

  const handleEncerrarInscricoes = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `📝 Deseja encerrar as inscrições da etapa "${etapa.nome}"?\n\n` +
        `Atualmente há ${etapa.totalInscritos} jogador(es) inscrito(s).\n\n` +
        `Após encerrar, não será mais possível:\n` +
        `• Adicionar novos jogadores\n` +
        `• Cancelar inscrições\n\n` +
        `Você poderá gerar as chaves após o encerramento.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      console.log("📝 Encerrando inscrições...");

      await etapaService.encerrarInscricoes(etapa.id);

      alert(
        "✅ Inscrições encerradas com sucesso!\n\nAgora você pode gerar as chaves da etapa."
      );

      // Recarregar etapa para ver as mudanças
      await carregarEtapa();
    } catch (err: any) {
      console.error("❌ Erro ao encerrar inscrições:", err);
      alert(err.message || "Erro ao encerrar inscrições");
    } finally {
      setLoading(false);
    }
  };

  const handleReabrirInscricoes = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🔓 Deseja reabrir as inscrições da etapa "${etapa.nome}"?\n\n` +
        `Atualmente há ${etapa.totalInscritos} jogador(es) inscrito(s) ` +
        `de ${etapa.maxJogadores} vaga(s).\n\n` +
        `Após reabrir, você poderá:\n` +
        `• Adicionar novos jogadores\n` +
        `• Cancelar inscrições existentes\n\n` +
        `Você poderá encerrar novamente quando estiver pronto.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      console.log("🔓 Reabrindo inscrições...");

      await etapaService.reabrirInscricoes(etapa.id);

      alert(
        "✅ Inscrições reabertas com sucesso!\n\n" +
          "Agora você pode adicionar ou remover jogadores."
      );

      // Recarregar etapa para ver as mudanças
      await carregarEtapa();
    } catch (err: any) {
      console.error("❌ Erro ao reabrir inscrições:", err);
      alert(err.message || "Erro ao reabrir inscrições");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirChaves = async () => {
    if (!etapa) return;

    try {
      setExcluindo(true);
      console.log("🗑️ Excluindo chaves...");

      await chaveService.excluirChaves(etapa.id);

      setModalExcluirAberto(false);

      alert(
        "✅ Chaves excluídas com sucesso!\n\n" +
          'A etapa voltou ao status "Inscrições Encerradas".\n' +
          "Você pode gerar as chaves novamente quando quiser."
      );

      // Recarregar etapa para ver as mudanças
      await carregarEtapa();

      // Voltar para visão geral
      setAbaAtiva("visao-geral");
    } catch (err: any) {
      console.error("❌ Erro ao excluir chaves:", err);
      alert(err.message || "Erro ao excluir chaves");
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando etapa...</p>
        </div>
      </div>
    );
  }

  if (error || !etapa) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-4">
            {error || "Etapa não encontrada"}
          </p>
          <button
            onClick={() => navigate("/admin/etapas")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para etapas
          </button>
        </div>
      </div>
    );
  }

  const progresso = calcularProgresso();
  const inscricoesAbertas = etapa.status === StatusEtapa.INSCRICOES_ABERTAS;
  const inscricoesEncerradas =
    etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS;
  const vagasCompletas = etapa.totalInscritos === etapa.maxJogadores;
  const numeroValido =
    etapa.totalInscritos >= 4 && etapa.totalInscritos % 2 === 0;
  const podeGerarChaves =
    inscricoesEncerradas &&
    vagasCompletas &&
    numeroValido &&
    !etapa.chavesGeradas;
  const podeEncerrarInscricoes = inscricoesAbertas && numeroValido;
  const podeReabrirInscricoes =
    inscricoesEncerradas && !etapa.chavesGeradas && !vagasCompletas;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/etapas")}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Voltar
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{etapa.nome}</h1>
            {etapa.descricao && (
              <p className="text-gray-600 mt-2">{etapa.descricao}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={etapa.status} />

            {/* Botões de ação */}
            {!etapa.chavesGeradas && (
              <>
                <button
                  onClick={handleEditar}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  title="Editar etapa"
                >
                  ✏️ Editar
                </button>

                {etapa.totalInscritos === 0 && (
                  <button
                    onClick={handleExcluir}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    title="Excluir etapa"
                  >
                    🗑️ Excluir
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== NOVO: SISTEMA DE ABAS ==================== */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setAbaAtiva("visao-geral")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                abaAtiva === "visao-geral"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Visão Geral
            </button>

            <button
              onClick={() => setAbaAtiva("inscricoes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                abaAtiva === "inscricoes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📝 Inscrições{" "}
              {etapa.totalInscritos > 0 && (
                <span className="ml-1.5 py-0.5 px-2 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                  {etapa.totalInscritos}
                </span>
              )}
            </button>

            {etapa.chavesGeradas && (
              <>
                <button
                  onClick={() => setAbaAtiva("chaves")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    abaAtiva === "chaves"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  🎯 Grupos & Partidas
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
      {/* =============================================================== */}

      {/* ==================== CONTEÚDO DAS ABAS ==================== */}

      {/* ABA: VISÃO GERAL */}
      {abaAtiva === "visao-geral" && (
        <>
          {/* Cards Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Inscrições */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">👥</span>
                <div>
                  <p className="text-sm text-gray-500">Inscritos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {etapa.totalInscritos} / {etapa.maxJogadores}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      progresso === 100
                        ? "bg-green-500"
                        : progresso >= 75
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progresso}% preenchido
                </p>
              </div>
            </div>

            {/* Grupos */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎯</span>
                <div>
                  <p className="text-sm text-gray-500">Grupos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {etapa.qtdGrupos || 0}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>• {etapa.jogadoresPorGrupo} duplas por grupo</p>
                {etapa.chavesGeradas ? (
                  <p className="text-green-600 font-medium mt-2">
                    ✓ Chaves geradas
                  </p>
                ) : (
                  <p className="text-gray-400 mt-2">Chaves não geradas</p>
                )}
              </div>
            </div>

            {/* Realização */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📅</span>
                <div>
                  <p className="text-sm text-gray-500">Realização</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatarData(etapa.dataRealizacao)}
                  </p>
                </div>
              </div>

              {etapa.local && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📍</span>
                  <span>{etapa.local}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informações Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Datas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Datas Importantes
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Início das inscrições:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatarData(etapa.dataInicio)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Fim das inscrições:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatarData(etapa.dataFim)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Data de realização:
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {formatarData(etapa.dataRealizacao)}
                  </span>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Estatísticas
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nível:</span>
                  <span className="text-sm font-bold text-purple-600">
                    {etapa.nivel === "iniciante" && "🌱 Iniciante"}
                    {etapa.nivel === "intermediario" && "⚡ Intermediário"}
                    {etapa.nivel === "avancado" && "🔥 Avançado"}
                    {etapa.nivel === "profissional" && "⭐ Profissional"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total de duplas:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor(etapa.totalInscritos / 2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Vagas disponíveis:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {etapa.maxJogadores - etapa.totalInscritos}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Taxa de preenchimento:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {progresso}%
                  </span>
                </div>

                {etapa.chavesGeradas && etapa.dataGeracaoChaves && (
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Chaves geradas em:
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {formatarData(etapa.dataGeracaoChaves)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ⚡ Ações
            </h2>

            <div className="flex flex-wrap gap-3">
              {inscricoesAbertas && (
                <button
                  onClick={handleInscreverJogador}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Inscrever Jogador</span>
                </button>
              )}

              {podeEncerrarInscricoes && (
                <button
                  onClick={handleEncerrarInscricoes}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <span>📝</span>
                  <span>Encerrar Inscrições</span>
                </button>
              )}

              {podeGerarChaves && (
                <button
                  onClick={handleGerarChaves}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>🎲</span>
                  <span>Gerar Chaves</span>
                </button>
              )}

              {podeReabrirInscricoes && (
                <button
                  onClick={handleReabrirInscricoes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>🔓</span>
                  <span>Reabrir Inscrições</span>
                </button>
              )}

              {etapa.chavesGeradas && (
                <>
                  <button
                    onClick={() => setAbaAtiva("chaves")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <span>👁️</span>
                    <span>Ver Chaves</span>
                  </button>

                  <button
                    onClick={() => setModalExcluirAberto(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Excluir Chaves</span>
                  </button>
                </>
              )}

              <button
                onClick={() => navigate(`/admin/etapas/${etapa.id}/editar`)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <span>✏️</span>
                <span>Editar Etapa</span>
              </button>

              {!etapa.chavesGeradas && etapa.totalInscritos === 0 && (
                <button
                  onClick={handleExcluir}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <span>🗑️</span>
                  <span>Excluir Etapa</span>
                </button>
              )}
            </div>

            {/* Mensagens de Aviso */}
            {etapa.totalInscritos > 0 && !etapa.chavesGeradas && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  ⚠️ <strong>Atenção:</strong> Para excluir esta etapa, você
                  precisa cancelar todas as {etapa.totalInscritos}{" "}
                  inscrição(ões) primeiro.
                </p>
              </div>
            )}

            {etapa.chavesGeradas && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  🔒 <strong>Bloqueado:</strong> Não é possível excluir etapa
                  após geração de chaves.
                </p>
              </div>
            )}

            {inscricoesAbertas && etapa.totalInscritos < 4 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Você precisa de pelo menos 4 jogadores inscritos (número
                  par) para encerrar as inscrições.
                </p>
              </div>
            )}

            {inscricoesAbertas &&
              etapa.totalInscritos >= 4 &&
              etapa.totalInscritos % 2 !== 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Atenção:</strong> Você tem {etapa.totalInscritos}{" "}
                    jogadores (número ímpar). É necessário um número PAR de
                    jogadores para formar duplas.
                  </p>
                </div>
              )}

            {inscricoesAbertas && numeroValido && !vagasCompletas && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ <strong>Vagas incompletas:</strong> Esta etapa está
                  configurada para {etapa.maxJogadores} jogadores, mas possui
                  apenas {etapa.totalInscritos} inscrito(s).
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Opções:</strong>
                </p>
                <ul className="text-sm text-yellow-800 list-disc list-inside mt-1 space-y-1">
                  <li>
                    Aguardar completar as{" "}
                    {etapa.maxJogadores - etapa.totalInscritos} vaga(s)
                    restante(s), OU
                  </li>
                  <li>
                    Editar a etapa e ajustar o número máximo para{" "}
                    {etapa.totalInscritos} jogadores
                  </li>
                </ul>
              </div>
            )}

            {!inscricoesAbertas &&
              etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS &&
              !etapa.chavesGeradas &&
              vagasCompletas && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Pronto!</strong> Inscrições encerradas com{" "}
                    {etapa.totalInscritos} jogadores (vagas completas). Agora
                    você pode gerar as chaves!
                  </p>
                </div>
              )}

            {!inscricoesAbertas &&
              etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS &&
              !etapa.chavesGeradas &&
              !vagasCompletas && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 mb-2">
                    ⚠️ <strong>Não é possível gerar chaves:</strong> Esta etapa
                    está configurada para {etapa.maxJogadores} jogadores, mas
                    possui apenas {etapa.totalInscritos} inscrito(s).
                  </p>
                  <p className="text-sm text-orange-800">
                    <strong>Soluções:</strong>
                  </p>
                  <ul className="text-sm text-orange-800 list-disc list-inside mt-1 space-y-1">
                    <li>
                      Clique em "🔓 Reabrir Inscrições" e adicione mais{" "}
                      {etapa.maxJogadores - etapa.totalInscritos} jogador(es),
                      OU
                    </li>
                    <li>
                      Edite a etapa e ajuste o número máximo de jogadores para{" "}
                      {etapa.totalInscritos}
                    </li>
                  </ul>
                </div>
              )}
          </div>
        </>
      )}

      {/* ABA: INSCRIÇÕES */}
      {abaAtiva === "inscricoes" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📝 Jogadores Inscritos ({etapa.totalInscritos})
          </h2>

          {inscricoes.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {etapa.totalInscritos === 0
                  ? "Nenhum jogador inscrito ainda."
                  : "Carregando inscrições..."}
              </p>
              {etapa.totalInscritos === 0 && inscricoesAbertas && (
                <button
                  onClick={handleInscreverJogador}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕ Inscrever Primeiro Jogador
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inscricoes.map((inscricao) => (
                <div
                  key={inscricao.id}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {inscricao.jogadorNome}
                    </p>
                    <p className="text-sm text-gray-500">
                      {inscricao.jogadorNivel === "iniciante" && "🌱 Iniciante"}
                      {inscricao.jogadorNivel === "intermediario" &&
                        "⚡ Intermediário"}
                      {inscricao.jogadorNivel === "avancado" && "🔥 Avançado"}
                      {inscricao.jogadorNivel === "profissional" &&
                        "⭐ Profissional"}
                    </p>
                  </div>

                  {!etapa.chavesGeradas && (
                    <button
                      onClick={() =>
                        handleCancelarInscricao(
                          inscricao.id,
                          inscricao.jogadorNome
                        )
                      }
                      className="ml-3 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Cancelar inscrição"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {etapa.chavesGeradas && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Não é possível cancelar inscrições
                após a geração de chaves
              </p>
            </div>
          )}

          {inscricoesAbertas && (
            <div className="mt-4">
              <button
                onClick={handleInscreverJogador}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>➕</span>
                <span>Inscrever Novo Jogador</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ABA: CHAVES (Grupos e Partidas) */}
      {abaAtiva === "chaves" && etapa.chavesGeradas && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ChavesEtapa etapaId={etapa.id} arenaId={etapa.arenaId} />
        </div>
      )}

      {/* Modal de Inscrição */}
      {modalInscricaoAberto && etapa && (
        <ModalInscricao
          etapaId={etapa.id}
          etapaNome={etapa.nome}
          etapaNivel={etapa.nivel}
          maxJogadores={etapa.maxJogadores}
          totalInscritos={etapa.totalInscritos}
          onClose={() => setModalInscricaoAberto(false)}
          onSuccess={handleInscricaoSuccess}
        />
      )}

      {/* Modal de Confirmação de Exclusão de Chaves */}
      <ConfirmacaoPerigosa
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={handleExcluirChaves}
        titulo="⚠️ Excluir Chaves?"
        mensagem={`Você está prestes a EXCLUIR TODAS AS CHAVES da etapa "${etapa?.nome}".\n\nIsso irá remover:\n• Todas as duplas\n• Todos os grupos\n• Todas as partidas\n• Todo o progresso do torneio\n\n⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!\n\nA etapa voltará ao status "Inscrições Encerradas" e você precisará gerar as chaves novamente do zero.`}
        palavraConfirmacao="EXCLUIR"
        textoBotao="Sim, excluir tudo"
        loading={excluindo}
      />
    </div>
  );
};
