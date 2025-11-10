import React, { useState, useEffect } from "react";
import { Partida, SetPartida, StatusPartida } from "../../types/chave";
import partidaService from "../../services/partidaService";

interface ModalRegistrarResultadoProps {
  partida: Partida;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para registrar ou editar resultado de uma partida
 */
export const ModalRegistrarResultado: React.FC<
  ModalRegistrarResultadoProps
> = ({ partida, onClose, onSuccess }) => {
  const isEdicao = partida.status === StatusPartida.FINALIZADA;

  const [set, setSet] = useState<SetPartida>({
    numero: 1,
    gamesDupla1: undefined as any, // Vazio inicialmente
    gamesDupla2: undefined as any, // Vazio inicialmente
    vencedorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preencher placar se for edição
  useEffect(() => {
    if (isEdicao && partida.placar && partida.placar.length > 0) {
      setSet({
        numero: 1,
        gamesDupla1: partida.placar[0].gamesDupla1,
        gamesDupla2: partida.placar[0].gamesDupla2,
        vencedorId: partida.placar[0].vencedorId || "",
      });
    }
  }, [isEdicao, partida.placar]);

  const handleSetChange = (
    campo: "gamesDupla1" | "gamesDupla2",
    valor: string
  ) => {
    const valorNumerico = valor === "" ? undefined : parseInt(valor);
    setSet({
      ...set,
      [campo]: valorNumerico,
    });
  };

  const calcularVencedor = () => {
    // Se algum campo não foi preenchido, não há vencedor ainda
    if (
      set.gamesDupla1 === undefined ||
      set.gamesDupla1 === null ||
      set.gamesDupla2 === undefined ||
      set.gamesDupla2 === null
    ) {
      return null;
    }

    if (set.gamesDupla1 > set.gamesDupla2) {
      return {
        vencedor: partida.dupla1Nome,
        placar: `${set.gamesDupla1} x ${set.gamesDupla2}`,
      };
    } else if (set.gamesDupla2 > set.gamesDupla1) {
      return {
        vencedor: partida.dupla2Nome,
        placar: `${set.gamesDupla1} x ${set.gamesDupla2}`,
      };
    }
    return null;
  };

  const validarPlacar = (): boolean => {
    // Verificar se o placar foi preenchido
    if (
      (set.gamesDupla1 === undefined || set.gamesDupla1 === null) &&
      (set.gamesDupla2 === undefined || set.gamesDupla2 === null)
    ) {
      setErro("O placar deve ser preenchido");
      return false;
    }

    if (set.gamesDupla1 === undefined || set.gamesDupla1 === null) {
      setErro("Preencha o placar da primeira dupla");
      return false;
    }

    if (set.gamesDupla2 === undefined || set.gamesDupla2 === null) {
      setErro("Preencha o placar da segunda dupla");
      return false;
    }

    // Permitir 0x0 apenas se for empate técnico (mas vamos rejeitar por enquanto)
    if (set.gamesDupla1 === 0 && set.gamesDupla2 === 0) {
      setErro("O placar não pode ser 0 x 0");
      return false;
    }

    // Validar placar de set normal (6-4, 7-5, 7-6)
    const maxGames = Math.max(set.gamesDupla1, set.gamesDupla2);
    const minGames = Math.min(set.gamesDupla1, set.gamesDupla2);

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
      await partidaService.registrarResultado(partida.id, [set]);
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

          {/* Duplas */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-4">
              <span className="font-medium text-gray-900">
                {partida.dupla1Nome}
              </span>
              <span className="text-gray-400 font-bold">VS</span>
              <span className="font-medium text-gray-900">
                {partida.dupla2Nome}
              </span>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Set Único */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">🎾 Placar</h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Dupla 1 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {partida.dupla1Nome}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={set.gamesDupla1 ?? ""}
                      onChange={(e) =>
                        handleSetChange("gamesDupla1", e.target.value)
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
                      {partida.dupla2Nome}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={set.gamesDupla2 ?? ""}
                      onChange={(e) =>
                        handleSetChange("gamesDupla2", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vencedor */}
            {resultado && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <span className="text-sm text-green-700">🏆 Vencedor:</span>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    {resultado.vencedor}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Placar: {resultado.placar}
                  </p>
                </div>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">❌ {erro}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

          {/* Dicas */}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>
              💡 <strong>Placares válidos:</strong> 6-0, 6-1, 6-2, 6-3, 6-4,
              7-5, 7-6
            </p>
            <p>
              💡 <strong>Set único:</strong> Vencedor do set vence a partida
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
