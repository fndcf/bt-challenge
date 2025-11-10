import React, { useState, useEffect } from "react";
import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
} from "../../types/chave";
import chaveService from "../../services/chaveService";

interface ModalRegistrarResultadoEliminatorioProps {
  confronto: ConfrontoEliminatorio;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para registrar ou editar resultado de um confronto eliminatório
 */
export const ModalRegistrarResultadoEliminatorio: React.FC<
  ModalRegistrarResultadoEliminatorioProps
> = ({ confronto, onClose, onSuccess }) => {
  const isEdicao = confronto.status === StatusConfrontoEliminatorio.FINALIZADA;

  const [gamesDupla1, setGamesDupla1] = useState<number | undefined>(undefined);
  const [gamesDupla2, setGamesDupla2] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preencher placar se for edição
  useEffect(() => {
    if (isEdicao && confronto.placar) {
      const [g1, g2] = confronto.placar.split("-").map(Number);
      setGamesDupla1(g1);
      setGamesDupla2(g2);
    }
  }, [isEdicao, confronto.placar]);

  const calcularVencedor = () => {
    if (
      gamesDupla1 === undefined ||
      gamesDupla1 === null ||
      gamesDupla2 === undefined ||
      gamesDupla2 === null
    ) {
      return null;
    }

    if (gamesDupla1 > gamesDupla2) {
      return {
        vencedor: confronto.dupla1Nome!,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
      };
    } else if (gamesDupla2 > gamesDupla1) {
      return {
        vencedor: confronto.dupla2Nome!,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
      };
    }
    return null;
  };

  const validarPlacar = (): boolean => {
    // Verificar se o placar foi preenchido
    if (
      (gamesDupla1 === undefined || gamesDupla1 === null) &&
      (gamesDupla2 === undefined || gamesDupla2 === null)
    ) {
      setErro("O placar deve ser preenchido");
      return false;
    }

    if (gamesDupla1 === undefined || gamesDupla1 === null) {
      setErro("Preencha o placar da primeira dupla");
      return false;
    }

    if (gamesDupla2 === undefined || gamesDupla2 === null) {
      setErro("Preencha o placar da segunda dupla");
      return false;
    }

    // Permitir 0x0 apenas se for empate técnico (mas vamos rejeitar por enquanto)
    if (gamesDupla1 === 0 && gamesDupla2 === 0) {
      setErro("O placar não pode ser 0 x 0");
      return false;
    }

    // Validar placar de set normal (6-4, 7-5, 7-6)
    const maxGames = Math.max(gamesDupla1, gamesDupla2);
    const minGames = Math.min(gamesDupla1, gamesDupla2);

    if (maxGames < 6) {
      setErro("O set deve ter no mínimo 6 games para o vencedor");
      return false;
    }

    if (maxGames === 6 && minGames > 4) {
      setErro("Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4");
      return false;
    }

    if (maxGames === 7 && minGames < 5) {
      setErro("Set com 7 games: placar deve ser 7-5 ou 7-6");
      return false;
    }

    if (maxGames > 7) {
      setErro("Set não pode ter mais de 7 games");
      return false;
    }

    // Verificar se há um vencedor
    const resultado = calcularVencedor();
    if (!resultado) {
      setErro("Não há um vencedor definido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!validarPlacar()) {
      return;
    }

    try {
      setLoading(true);
      await chaveService.registrarResultadoEliminatorio(confronto.id, [
        {
          numero: 1,
          gamesDupla1: gamesDupla1!,
          gamesDupla2: gamesDupla2!,
        },
      ]);
      alert(
        isEdicao
          ? "✅ Resultado atualizado com sucesso!"
          : "✅ Resultado registrado com sucesso!"
      );
      onSuccess();
    } catch (err: any) {
      console.error("Erro ao registrar resultado:", err);
      setErro(
        err.message ||
          `Erro ao ${isEdicao ? "atualizar" : "registrar"} resultado`
      );
    } finally {
      setLoading(false);
    }
  };

  const resultado = calcularVencedor();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {isEdicao ? "✏️ Editar Resultado" : "📝 Registrar Resultado"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Info do confronto */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700 font-semibold mb-1">
                Confronto Eliminatório
              </div>
              <div className="text-xs text-blue-600">
                {confronto.dupla1Origem} vs {confronto.dupla2Origem}
              </div>
            </div>

            {/* Placar */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🎾 Placar do Set
              </label>

              <div className="grid grid-cols-2 gap-4">
                {/* Dupla 1 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {confronto.dupla1Nome}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={gamesDupla1 ?? ""}
                    onChange={(e) =>
                      setGamesDupla1(
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value)
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Dupla 2 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {confronto.dupla2Nome}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={gamesDupla2 ?? ""}
                    onChange={(e) =>
                      setGamesDupla2(
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value)
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Resultado calculado */}
            {resultado && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 font-semibold mb-1">
                  🏆 Vencedor
                </div>
                <div className="text-lg font-bold text-green-700">
                  {resultado.vencedor}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Placar: {resultado.placar}
                </div>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ❌ {erro}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || !resultado}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{isEdicao ? "Atualizando..." : "Salvando..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isEdicao ? "✏️" : "✅"}</span>
                    <span>
                      {isEdicao ? "Atualizar Resultado" : "Salvar Resultado"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Aviso */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-700">
              ⚠️ <strong>Importante:</strong> O vencedor avançará
              automaticamente para a próxima fase!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
