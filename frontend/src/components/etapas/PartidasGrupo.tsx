import React, { useState, useEffect } from "react";
import chaveService from "../../services/chaveService";
import { Partida, StatusPartida } from "../../types/chave";
import { ModalRegistrarResultado } from "./ModalRegistrarResultado";

interface PartidasGrupoProps {
  etapaId: string;
  grupoId: string;
  grupoNome: string;
  onAtualizarGrupos?: () => void; // ← ADICIONAR callback
  eliminatoriaExiste?: boolean; // ← NOVA PROP
}

/**
 * Componente para visualizar e gerenciar partidas de um grupo
 */
export const PartidasGrupo: React.FC<PartidasGrupoProps> = ({
  etapaId,
  grupoId,
  grupoNome,
  onAtualizarGrupos, // ← ADICIONAR
  eliminatoriaExiste = false, // ← NOVA PROP
}) => {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(
    null
  );

  useEffect(() => {
    carregarPartidas();
  }, [etapaId, grupoId]);

  const carregarPartidas = async () => {
    try {
      setLoading(true);
      const todasPartidas = await chaveService.buscarPartidas(etapaId);
      const partidasDoGrupo = todasPartidas.filter(
        (p) => p.grupoId === grupoId
      );
      setPartidas(partidasDoGrupo);
    } catch (err: any) {
      console.error("Erro ao carregar partidas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResultadoRegistrado = () => {
    setPartidaSelecionada(null);
    carregarPartidas(); // Recarregar partidas

    // ============== NOTIFICAR PAI PARA ATUALIZAR GRUPOS ==============
    if (onAtualizarGrupos) {
      console.log("🔄 Notificando componente pai para atualizar grupos...");
      onAtualizarGrupos();
    }
    // =================================================================
  };

  const getStatusBadge = (status: StatusPartida) => {
    const badges = {
      [StatusPartida.AGENDADA]: "bg-yellow-100 text-yellow-800",
      [StatusPartida.EM_ANDAMENTO]: "bg-blue-100 text-blue-800",
      [StatusPartida.FINALIZADA]: "bg-green-100 text-green-800",
      [StatusPartida.CANCELADA]: "bg-gray-100 text-gray-800",
      [StatusPartida.WO]: "bg-red-100 text-red-800",
    };

    const labels = {
      [StatusPartida.AGENDADA]: "⏳ Aguardando",
      [StatusPartida.EM_ANDAMENTO]: "▶️ Em andamento",
      [StatusPartida.FINALIZADA]: "✅ Finalizada",
      [StatusPartida.CANCELADA]: "❌ Cancelada",
      [StatusPartida.WO]: "⚠️ W.O.",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar partidas: {error}</p>
      </div>
    );
  }

  if (partidas.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          Nenhuma partida encontrada para este grupo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          🎾 Partidas - {grupoNome}
        </h3>
        <span className="text-sm text-gray-500">
          {partidas.filter((p) => p.status === StatusPartida.FINALIZADA).length}{" "}
          / {partidas.length} finalizadas
        </span>
      </div>

      <div className="space-y-3">
        {partidas.map((partida, index) => (
          <div
            key={partida.id || `partida-${index}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  PARTIDA {index + 1}
                </span>
                {getStatusBadge(partida.status)}
              </div>
            </div>

            <div className="space-y-2">
              {/* Dupla 1 */}
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium ${
                    partida.vencedoraId === partida.dupla1Id
                      ? "text-green-600 font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {partida.dupla1Nome}
                </span>
                {partida.status === StatusPartida.FINALIZADA && (
                  <span className="text-lg font-bold text-gray-900">
                    {partida.setsDupla1}
                  </span>
                )}
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">VS</span>
              </div>

              {/* Dupla 2 */}
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium ${
                    partida.vencedoraId === partida.dupla2Id
                      ? "text-green-600 font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {partida.dupla2Nome}
                </span>
                {partida.status === StatusPartida.FINALIZADA && (
                  <span className="text-lg font-bold text-gray-900">
                    {partida.setsDupla2}
                  </span>
                )}
              </div>
            </div>

            {/* Placar detalhado */}
            {partida.status === StatusPartida.FINALIZADA &&
              partida.placar.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium">Placar:</span>
                    {partida.placar.map((set, idx) => (
                      <span key={idx} className="font-mono">
                        {set.gamesDupla1}-{set.gamesDupla2}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Botões de ação */}
            {partida.status === StatusPartida.AGENDADA && (
              <div className="mt-4">
                <button
                  onClick={() => setPartidaSelecionada(partida)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📝</span>
                  <span>Registrar Resultado</span>
                </button>
              </div>
            )}

            {partida.status === StatusPartida.FINALIZADA && (
              <div className="mt-4">
                <button
                  onClick={() => setPartidaSelecionada(partida)}
                  disabled={eliminatoriaExiste}
                  className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    eliminatoriaExiste
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-yellow-600 text-white hover:bg-yellow-700"
                  }`}
                  title={
                    eliminatoriaExiste
                      ? "⚠️ Não é possível editar após gerar a eliminatória. Cancele a eliminatória primeiro."
                      : "Editar resultado desta partida"
                  }
                >
                  <span>{eliminatoriaExiste ? "🔒" : "✏️"}</span>
                  <span>Editar Resultado</span>
                </button>
                {eliminatoriaExiste && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    ⚠️ Para editar, cancele a eliminatória primeiro
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de registro de resultado */}
      {partidaSelecionada && (
        <ModalRegistrarResultado
          partida={partidaSelecionada}
          onClose={() => setPartidaSelecionada(null)}
          onSuccess={handleResultadoRegistrado}
        />
      )}
    </div>
  );
};
