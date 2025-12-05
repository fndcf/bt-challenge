/**
 * Responsabilidade única: Compor hooks especializados para gerenciar página de detalhes
 */

import { useCallback } from "react";
import { useEtapaData, type EtapaComInscricoes } from "./useEtapaData";
import { useEtapaInscricoes } from "./useEtapaInscricoes";
import { useEtapaChaves } from "./useEtapaChaves";
import { useEtapaUI, type AbaEtapa } from "./useEtapaUI";

export type { EtapaComInscricoes, AbaEtapa };

interface UseDetalhesEtapaReturn {
  // Estado de dados
  etapa: EtapaComInscricoes | null;
  loading: boolean;
  error: string;

  // Flags derivadas
  isReiDaPraia: boolean;
  progresso: number;

  // Estado de UI
  abaAtiva: AbaEtapa;
  modalInscricaoAberto: boolean;
  modalConfirmacaoAberto: boolean;

  // Actions - Dados
  carregarEtapa: () => Promise<void>;

  // Actions - Inscrições
  handleAbrirInscricoes: () => Promise<void>;
  handleEncerrarInscricoes: () => Promise<void>;
  handleFinalizarEtapa: () => Promise<void>;
  handleCancelarInscricao: (
    inscricaoId: string,
    jogadorNome: string
  ) => Promise<void>;
  handleCancelarMultiplosInscricoes: (inscricaoIds: string[]) => Promise<void>;

  // Actions - Chaves
  handleGerarChaves: () => Promise<void>;
  handleApagarChaves: () => Promise<void>;

  // UI Handlers
  setAbaAtiva: (aba: AbaEtapa) => void;
  setModalInscricaoAberto: (aberto: boolean) => void;
  setModalConfirmacaoAberto: (aberto: boolean) => void;
}

/**
 * Hook compositor para gerenciar detalhes de uma etapa
 *
 * @param etapaId - ID da etapa a ser gerenciada
 * @returns Interface completa para gerenciar detalhes da etapa
 */
export const useDetalhesEtapa = (etapaId?: string): UseDetalhesEtapaReturn => {
  // ============================================
  // 1. DADOS DA ETAPA
  // ============================================
  const { etapa, loading, error, isReiDaPraia, progresso, recarregar } =
    useEtapaData(etapaId);

  // ============================================
  // 2. ESTADO DA UI
  // ============================================
  const {
    abaAtiva,
    modalInscricaoAberto,
    modalConfirmacaoAberto,
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  } = useEtapaUI();

  // ============================================
  // 3. AÇÕES DE INSCRIÇÃO
  // ============================================
  const {
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleFinalizarEtapa,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,
  } = useEtapaInscricoes({
    etapa,
    onSuccess: recarregar,
  });

  // ============================================
  // 4. AÇÕES DE CHAVES
  // ============================================
  const onSuccessChaves = useCallback(
    async (aba?: AbaEtapa) => {
      await recarregar();
      if (aba) setAbaAtiva(aba);
    },
    [recarregar, setAbaAtiva]
  );

  const { handleGerarChaves, handleApagarChaves } = useEtapaChaves({
    etapa,
    onSuccess: onSuccessChaves,
  });

  // ============================================
  // RETORNO COMPLETO
  // ============================================
  return {
    // Estado de dados
    etapa,
    loading,
    error,

    // Flags derivadas
    isReiDaPraia,
    progresso,

    // Estado de UI
    abaAtiva,
    modalInscricaoAberto,
    modalConfirmacaoAberto,

    // Actions - Dados
    carregarEtapa: recarregar,

    // Actions - Inscrições
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleFinalizarEtapa,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,

    // Actions - Chaves
    handleGerarChaves,
    handleApagarChaves,

    // UI Handlers
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  };
};

export default useDetalhesEtapa;
