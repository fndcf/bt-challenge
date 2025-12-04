/**
 * useDetalhesEtapa.ts
 *
 * Responsabilidade única: Compor hooks especializados para gerenciar página de detalhes
 *
 * SOLID aplicado:
 * - SRP: Hook compositor que delega responsabilidades
 * - OCP: Aberto para extensão (novos hooks podem ser adicionados)
 * - DIP: Depende de abstrações (hooks especializados)
 * - ISP: Cada hook tem interface segregada
 *
 * Composição de hooks:
 * - useEtapaData: Gerencia dados da etapa
 * - useEtapaInscricoes: Gerencia ações de inscrição
 * - useEtapaChaves: Gerencia ações de chaves
 * - useEtapaUI: Gerencia estado da UI
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
  handleCancelarInscricao: (inscricaoId: string, jogadorNome: string) => Promise<void>;
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
 * Este hook segue o padrão de composição, delegando responsabilidades
 * para hooks especializados menores. Isso melhora:
 * - Testabilidade (cada hook pode ser testado isoladamente)
 * - Manutenibilidade (mudanças em uma área não afetam outras)
 * - Reusabilidade (hooks podem ser usados em outros contextos)
 *
 * @param etapaId - ID da etapa a ser gerenciada
 * @returns Interface completa para gerenciar detalhes da etapa
 */
export const useDetalhesEtapa = (etapaId?: string): UseDetalhesEtapaReturn => {
  // ============================================
  // 1. DADOS DA ETAPA
  // ============================================
  const {
    etapa,
    loading,
    error,
    isReiDaPraia,
    progresso,
    recarregar,
  } = useEtapaData(etapaId);

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
