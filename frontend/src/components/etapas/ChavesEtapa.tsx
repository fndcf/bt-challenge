import React, { useState, useEffect } from "react";
import chaveService from "../../services/chaveService";
import { Dupla, Grupo } from "../../types/chave";
import { PartidasGrupo } from "./PartidasGrupo";
import { FaseEliminatoria } from "./FaseEliminatoria";

interface ChavesEtapaProps {
  etapaId: string;
  arenaId?: string; // ← ADICIONAR
}

type AbaAtiva = "grupos" | "eliminatoria";

/**
 * Componente para visualizar chaves geradas (grupos, duplas e eliminatória)
 */
export const ChavesEtapa: React.FC<ChavesEtapaProps> = ({
  etapaId,
  arenaId,
}) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [duplas, setDuplas] = useState<Dupla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null);

  // ============== VERIFICAR SE ELIMINATÓRIA EXISTE ==============
  const [eliminatoriaExiste, setEliminatoriaExiste] = useState(false);
  // ==============================================================

  // ============== SISTEMA DE ABAS ==============
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("grupos");
  // =============================================

  useEffect(() => {
    carregarChaves();
  }, [etapaId]);

  // Recarregar grupos quando entrar na aba eliminatória
  useEffect(() => {
    if (abaAtiva === "eliminatoria") {
      console.log("🔄 Aba eliminatória aberta - recarregando grupos...");
      carregarChaves();
    }
  }, [abaAtiva]);

  // ============== LOG: Ver estado dos grupos ==============
  useEffect(() => {
    console.log("🔍 ChavesEtapa: Estado 'grupos' mudou!");
    console.log("🔍 ChavesEtapa: grupos.length =", grupos?.length || 0);
    console.log("🔍 ChavesEtapa: grupos =", grupos);
  }, [grupos]);
  // ========================================================

  const carregarChaves = async () => {
    try {
      setLoading(true);
      console.log("🔄 ChavesEtapa: Carregando grupos e duplas...");
      const [gruposData, duplasData] = await Promise.all([
        chaveService.buscarGrupos(etapaId),
        chaveService.buscarDuplas(etapaId),
      ]);

      console.log(
        "✅ ChavesEtapa: Grupos carregados:",
        gruposData?.length || 0
      );
      console.log(
        "✅ ChavesEtapa: Duplas carregadas:",
        duplasData?.length || 0
      );
      console.log("📊 ChavesEtapa: Grupos DATA:", gruposData);

      setGrupos(gruposData);
      setDuplas(duplasData);

      // ============== VERIFICAR SE ELIMINATÓRIA EXISTE ==============
      try {
        const confrontos = await chaveService.buscarConfrontosEliminatorios(
          etapaId
        );
        const existe = confrontos && confrontos.length > 0;
        setEliminatoriaExiste(existe);
        console.log("🔍 ChavesEtapa: Eliminatória existe?", existe);
      } catch (err) {
        console.log("🔍 ChavesEtapa: Sem eliminatória");
        setEliminatoriaExiste(false);
      }
      // ==============================================================

      // Log após setar no estado
      console.log("✅ ChavesEtapa: Estado atualizado!");
    } catch (err: any) {
      console.error("Erro ao carregar chaves:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar chaves: {error}</p>
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Nenhuma chave gerada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============== ABAS ============== */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setAbaAtiva("grupos")}
            className={`
              px-4 py-3 border-b-2 font-medium text-sm transition-colors
              ${
                abaAtiva === "grupos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            📊 Fase de Grupos
          </button>
          <button
            onClick={() => setAbaAtiva("eliminatoria")}
            className={`
              px-4 py-3 border-b-2 font-medium text-sm transition-colors
              ${
                abaAtiva === "eliminatoria"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            🏆 Eliminatória
          </button>
        </nav>
      </div>
      {/* ================================== */}

      {/* ============== CONTEÚDO DAS ABAS ============== */}
      {abaAtiva === "grupos" ? (
        // ABA GRUPOS (código original)
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Grupos e Duplas
            </h2>
            <div className="text-sm text-gray-500">
              {grupos.length} grupos • {duplas.length} duplas
            </div>
          </div>

          {/* Lista de Grupos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {grupos.map((grupo) => {
              const duplasDoGrupo = duplas.filter(
                (d) => d.grupoId === grupo.id
              );

              return (
                <div
                  key={grupo.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Header do Grupo */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">
                        {grupo.nome}
                      </h3>
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                        <span className="text-sm font-medium text-white">
                          {duplasDoGrupo.length} duplas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Duplas */}
                  <div className="divide-y divide-gray-100">
                    {duplasDoGrupo.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        Nenhuma dupla neste grupo
                      </div>
                    ) : (
                      duplasDoGrupo.map((dupla, index) => (
                        <div
                          key={dupla.id}
                          className="px-4 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Posição */}
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">
                                {index + 1}
                              </span>
                            </div>

                            {/* Jogadores */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {dupla.jogador1Nome}
                                </span>
                                <span className="text-gray-400">&</span>
                                <span className="font-medium text-gray-900 truncate">
                                  {dupla.jogador2Nome}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Nível: {dupla.jogador1Nivel}
                              </div>
                            </div>

                            {/* Estatísticas (se houver) */}
                            {dupla.jogos > 0 && (
                              <div className="flex-shrink-0 text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  {dupla.pontos} pts
                                </div>
                                <div className="text-xs text-gray-500">
                                  {dupla.vitorias}V - {dupla.derrotas}D
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer do Grupo */}
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {grupo.partidasFinalizadas} / {grupo.totalPartidas}{" "}
                        partidas jogadas
                      </span>
                      {grupo.completo && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">
                          ✓ Completo
                        </span>
                      )}
                    </div>

                    {/* Botão Ver Partidas */}
                    <button
                      onClick={() =>
                        setGrupoSelecionado(
                          grupoSelecionado === grupo.id ? null : grupo.id
                        )
                      }
                      className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <span>⚔️</span>
                      <span>
                        {grupoSelecionado === grupo.id
                          ? "Ocultar Partidas"
                          : "Ver Partidas"}
                      </span>
                    </button>

                    {/* Partidas do Grupo */}
                    {grupoSelecionado === grupo.id && (
                      <div className="mt-4">
                        <PartidasGrupo
                          etapaId={etapaId}
                          grupoId={grupo.id}
                          grupoNome={grupo.nome}
                          onAtualizarGrupos={carregarChaves}
                          eliminatoriaExiste={eliminatoriaExiste}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Informações Adicionais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Fase de Grupos
                </h4>
                <p className="text-sm text-blue-700">
                  Cada dupla joga contra todas as outras duplas do seu grupo. As
                  duplas com melhor campanha classificam para a próxima fase.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ABA ELIMINATÓRIA
        <>
          {(() => {
            console.log(
              "🔍 ChavesEtapa: Passando grupos para FaseEliminatoria"
            );
            console.log("🔍 Quantidade:", grupos?.length || 0);
            grupos?.forEach((g, i) => {
              console.log(`🔍 Grupo ${i + 1} (${g.nome}):`, {
                completo: g.completo,
                partidasFinalizadas: g.partidasFinalizadas,
                totalPartidas: g.totalPartidas,
              });
            });
            return null;
          })()}
          <FaseEliminatoria
            etapaId={etapaId}
            arenaId={arenaId || ""}
            grupos={grupos}
          />
        </>
      )}
      {/* =============================================== */}
    </div>
  );
};
