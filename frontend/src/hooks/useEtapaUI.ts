/**
 * Responsabilidade única: Gerenciar estado da interface (UI state)
 */

import { useState } from "react";

export type AbaEtapa = "inscricoes" | "chaves" | "cabeças";

export interface UseEtapaUIReturn {
  // Estado
  abaAtiva: AbaEtapa;
  modalInscricaoAberto: boolean;
  modalConfirmacaoAberto: boolean;

  // Setters
  setAbaAtiva: (aba: AbaEtapa) => void;
  setModalInscricaoAberto: (aberto: boolean) => void;
  setModalConfirmacaoAberto: (aberto: boolean) => void;
}

/**
 * Hook para gerenciar estado da interface da página de detalhes da etapa
 *
 * @returns Estado da UI e funções para modificá-lo
 */
export const useEtapaUI = (): UseEtapaUIReturn => {
  // Estado
  const [abaAtiva, setAbaAtiva] = useState<AbaEtapa>("inscricoes");
  const [modalInscricaoAberto, setModalInscricaoAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

  return {
    // Estado
    abaAtiva,
    modalInscricaoAberto,
    modalConfirmacaoAberto,

    // Setters
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  };
};

export default useEtapaUI;
