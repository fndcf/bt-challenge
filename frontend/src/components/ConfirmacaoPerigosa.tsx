import React, { useState } from "react";

interface ConfirmacaoPerigosaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  palavraConfirmacao: string;
  textoBotao?: string;
  loading?: boolean;
}

/**
 * Modal de confirmação para ações perigosas
 * Requer que o usuário digite uma palavra específica para confirmar
 */
export const ConfirmacaoPerigosa: React.FC<ConfirmacaoPerigosaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  palavraConfirmacao,
  textoBotao = "Confirmar",
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  const isConfirmacaoCorreta =
    inputValue.toUpperCase() === palavraConfirmacao.toUpperCase();

  const handleConfirm = () => {
    if (isConfirmacaoCorreta) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Ícone de Aviso */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <span className="text-2xl">⚠️</span>
          </div>

          {/* Título */}
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            {titulo}
          </h3>

          {/* Mensagem */}
          <div className="text-sm text-gray-600 text-center mb-6 whitespace-pre-line">
            {mensagem}
          </div>

          {/* Input de Confirmação */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, digite{" "}
              <span className="font-bold text-red-600">
                {palavraConfirmacao}
              </span>
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Digite "${palavraConfirmacao}"`}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              autoFocus
            />
            {inputValue && !isConfirmacaoCorreta && (
              <p className="text-xs text-red-600 mt-1">❌ Texto incorreto</p>
            )}
            {isConfirmacaoCorreta && (
              <p className="text-xs text-green-600 mt-1">✅ Texto correto</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isConfirmacaoCorreta || loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <span>{textoBotao}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
