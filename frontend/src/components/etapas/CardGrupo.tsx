// ==================== MELHORIA 5: CARDS DE GRUPOS INTERATIVOS ====================

// frontend/src/components/etapas/CardGrupoMelhorado.tsx

import React, { useState, useEffect } from "react";
import { Grupo, Dupla } from "../../types/chave";
import chaveService from "../../services/chaveService";

interface CardGrupoProps {
  grupo: Grupo;
  etapaId: string;
  onAtualizar: () => void;
  bloqueado?: boolean;
}

export const CardGrupo: React.FC<CardGrupoProps> = ({
  grupo,
  etapaId,
  onAtualizar,
  bloqueado = false,
}) => {
  const [duplas, setDuplas] = useState<Dupla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDuplas();
  }, [grupo.id]);

  const carregarDuplas = async () => {
    try {
      setLoading(true);
      // Buscar duplas do grupo ordenadas por posição
      const todasDuplas = await chaveService.buscarDuplas(etapaId);
      const duplasDoGrupo = todasDuplas
        .filter((d) => d.grupoId === grupo.id)
        .sort((a, b) => {
          // Ordenar por posição no grupo
          if (a.posicaoGrupo && b.posicaoGrupo) {
            return a.posicaoGrupo - b.posicaoGrupo;
          }
          // Se não tiver posição, ordenar por pontos
          if (a.pontos !== b.pontos) return b.pontos - a.pontos;
          if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
          return 0;
        });

      setDuplas(duplasDoGrupo);
    } catch (error) {
      console.error("Erro ao carregar duplas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando grupo atualizar
  useEffect(() => {
    carregarDuplas();
  }, [grupo.partidasFinalizadas]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header do Grupo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{grupo.nome}</h3>
          <div className="flex items-center gap-4">
            <span className="text-blue-100 text-sm">
              {grupo.partidasFinalizadas}/{grupo.totalPartidas} jogos
            </span>
            {grupo.completo && (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                ✅ Completo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============== TABELA DE CLASSIFICAÇÃO ============== */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Classificação
        </h4>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    Pos
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Dupla
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    PTS
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    J
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    V
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    D
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    GF
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    GC
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">
                    SG
                  </th>
                </tr>
              </thead>
              <tbody>
                {duplas.map((dupla, index) => {
                  const isClassificada = dupla.classificada;
                  const posicao = dupla.posicaoGrupo || index + 1;

                  return (
                    <tr
                      key={dupla.id}
                      className={`
                        border-b border-gray-200 transition-colors
                        ${isClassificada ? "bg-green-50" : "hover:bg-gray-50"}
                      `}
                    >
                      {/* Posição */}
                      <td className="py-3 px-2">
                        <div
                          className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${
                            posicao === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : posicao === 2
                              ? "bg-gray-300 text-gray-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                        >
                          {posicao}º
                        </div>
                      </td>

                      {/* Dupla */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {dupla.jogador1Nome} & {dupla.jogador2Nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              Nível: {dupla.jogador1Nivel}/{dupla.jogador2Nivel}
                            </p>
                          </div>
                          {isClassificada && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded">
                              ✓ Classificada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pontos */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-bold text-lg text-blue-600">
                          {dupla.pontos}
                        </span>
                      </td>

                      {/* Jogos */}
                      <td className="py-3 px-2 text-center text-gray-600">
                        {dupla.jogos}
                      </td>

                      {/* Vitórias */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-semibold text-green-600">
                          {dupla.vitorias}
                        </span>
                      </td>

                      {/* Derrotas */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-semibold text-red-600">
                          {dupla.derrotas}
                        </span>
                      </td>

                      {/* Games a Favor */}
                      <td className="py-3 px-2 text-center text-gray-600">
                        {dupla.gamesVencidos}
                      </td>

                      {/* Games Contra */}
                      <td className="py-3 px-2 text-center text-gray-600">
                        {dupla.gamesPerdidos}
                      </td>

                      {/* Saldo de Games */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`
                          font-semibold
                          ${
                            dupla.saldoGames > 0
                              ? "text-green-600"
                              : dupla.saldoGames < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }
                        `}
                        >
                          {dupla.saldoGames > 0 ? "+" : ""}
                          {dupla.saldoGames}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legenda */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-semibold">Legenda:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-semibold">PTS:</span> Pontos
            </div>
            <div>
              <span className="font-semibold">J:</span> Jogos
            </div>
            <div>
              <span className="font-semibold">V:</span> Vitórias
            </div>
            <div>
              <span className="font-semibold">D:</span> Derrotas
            </div>
            <div>
              <span className="font-semibold">GF:</span> Games a Favor
            </div>
            <div>
              <span className="font-semibold">GC:</span> Games Contra
            </div>
            <div>
              <span className="font-semibold">SG:</span> Saldo de Games
            </div>
          </div>
        </div>
      </div>

      {/* ============== PARTIDAS (opcional, pode manter ou não) ============== */}
      {/* ... código das partidas */}
    </div>
  );
};
