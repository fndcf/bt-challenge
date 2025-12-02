/**
 * useDetalhesEtapa.ts
 *
 * Responsabilidade única: Gerenciar estado e operações da página de detalhes de etapa
 */

import { useState, useEffect, useCallback } from "react";
import { Etapa, Inscricao, FormatoEtapa } from "../types/etapa";
import etapaService from "../services/etapaService";
import chaveService from "../services/chaveService";
import reiDaPraiaService from "../services/reiDaPraiaService";
import logger from "../utils/logger";

// Etapa estendida com inscrições
export interface EtapaComInscricoes extends Etapa {
  inscricoes?: Inscricao[];
}

interface UseDetalhesEtapaReturn {
  // Estado
  etapa: EtapaComInscricoes | null;
  loading: boolean;
  error: string;
  abaAtiva: "inscricoes" | "chaves" | "cabeças";
  modalInscricaoAberto: boolean;
  modalConfirmacaoAberto: boolean;

  // Flags derivadas
  isReiDaPraia: boolean;
  progresso: number;

  // Actions
  carregarEtapa: () => Promise<void>;
  handleAbrirInscricoes: () => Promise<void>;
  handleEncerrarInscricoes: () => Promise<void>;
  handleFinalizarEtapa: () => Promise<void>;
  handleCancelarInscricao: (inscricaoId: string, jogadorNome: string) => Promise<void>;
  handleCancelarMultiplosInscricoes: (inscricaoIds: string[]) => Promise<void>;
  handleGerarChaves: () => Promise<void>;
  handleApagarChaves: () => Promise<void>;

  // Modal handlers
  setAbaAtiva: (aba: "inscricoes" | "chaves" | "cabeças") => void;
  setModalInscricaoAberto: (aberto: boolean) => void;
  setModalConfirmacaoAberto: (aberto: boolean) => void;
}

/**
 * Hook para gerenciar detalhes de uma etapa
 */
export const useDetalhesEtapa = (etapaId?: string): UseDetalhesEtapaReturn => {
  // Estado
  const [etapa, setEtapa] = useState<EtapaComInscricoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<"inscricoes" | "chaves" | "cabeças">("inscricoes");
  const [modalInscricaoAberto, setModalInscricaoAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

  // Flags derivadas
  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;
  const progresso = etapa && etapa.maxJogadores > 0
    ? Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100)
    : 0;

  /**
   * Carregar dados da etapa
   */
  const carregarEtapa = useCallback(async () => {
    if (!etapaId) {
      setError("ID da etapa não fornecido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Carregar etapa e inscrições em paralelo
      const [etapaData, inscricoesData] = await Promise.all([
        etapaService.buscarPorId(etapaId),
        etapaService.listarInscricoes(etapaId)
      ]);

      // Adicionar inscrições ao objeto da etapa
      const etapaComInscricoes: EtapaComInscricoes = {
        ...etapaData,
        inscricoes: inscricoesData
      };

      setEtapa(etapaComInscricoes);
    } catch (err: any) {
      logger.error("Erro ao carregar etapa", { etapaId }, err);
      setError(err.message || "Erro ao carregar etapa");
    } finally {
      setLoading(false);
    }
  }, [etapaId]);

  /**
   * Abrir/Reabrir inscrições
   */
  const handleAbrirInscricoes = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🎾 Deseja reabrir as inscrições para "${etapa.nome}"?\n\n` +
        `Os jogadores poderão se inscrever novamente.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.reabrirInscricoes(etapa.id);
      await carregarEtapa();
      alert("Inscrições reabertas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao reabrir inscrições", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao reabrir inscrições");
      setLoading(false);
    }
  }, [etapa, carregarEtapa]);

  /**
   * Encerrar inscrições
   */
  const handleEncerrarInscricoes = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `⚠️ Deseja encerrar as inscrições para "${etapa.nome}"?\n\n` +
        `Após encerrar, novos jogadores não poderão se inscrever.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.encerrarInscricoes(etapa.id);
      await carregarEtapa();
      alert("Inscrições encerradas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao encerrar inscrições", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao encerrar inscrições");
      setLoading(false);
    }
  }, [etapa, carregarEtapa]);

  /**
   * Finalizar etapa
   */
  const handleFinalizarEtapa = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🏆 Deseja finalizar a etapa "${etapa.nome}"?\n\n` +
        `Isso marcará a etapa como concluída.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.encerrarEtapa(etapa.id);
      await carregarEtapa();
      alert("Etapa finalizada com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao finalizar etapa", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao finalizar etapa");
      setLoading(false);
    }
  }, [etapa, carregarEtapa]);

  /**
   * Cancelar inscrição
   */
  const handleCancelarInscricao = useCallback(
    async (inscricaoId: string, jogadorNome: string) => {
      if (!etapa) return;

      const confirmar = window.confirm(
        `Deseja cancelar a inscrição de ${jogadorNome}?`
      );

      if (!confirmar) return;

      try {
        await etapaService.cancelarInscricao(etapa.id, inscricaoId);
        await carregarEtapa();
        alert("Inscrição cancelada com sucesso!");
      } catch (err: any) {
        logger.error("Erro ao cancelar inscrição", { etapaId: etapa.id, inscricaoId }, err);
        alert(err.message || "Erro ao cancelar inscrição");
      }
    },
    [etapa, carregarEtapa]
  );

  /**
   * Cancelar múltiplas inscrições
   */
  const handleCancelarMultiplosInscricoes = useCallback(
    async (inscricaoIds: string[]) => {
      if (!etapa) return;

      try {
        // Cancelar sequencialmente para evitar sobrecarga
        for (const inscricaoId of inscricaoIds) {
          await etapaService.cancelarInscricao(etapa.id, inscricaoId);
        }

        await carregarEtapa();
        alert(`${inscricaoIds.length} inscrição(ões) cancelada(s) com sucesso!`);
      } catch (err: any) {
        logger.error("Erro ao cancelar múltiplas inscrições", { etapaId: etapa.id, count: inscricaoIds.length }, err);
        throw err; // Re-throw para o componente tratar
      }
    },
    [etapa, carregarEtapa]
  );

  /**
   * Gerar chaves
   */
  const handleGerarChaves = useCallback(async () => {
    if (!etapa) return;

    const formatoNome = isReiDaPraia ? "Rei da Praia" : "Dupla Fixa";
    const detalhes = isReiDaPraia
      ? `• ${etapa.totalInscritos / 4} grupos de 4 jogadores\n` +
        `• ${(etapa.totalInscritos / 4) * 3} partidas na fase de grupos\n` +
        `• Estatísticas individuais por jogador`
      : `• ${etapa.qtdGrupos} grupos\n` +
        `• ${Math.floor(etapa.totalInscritos / 2)} duplas\n` +
        `• Todos os confrontos da fase de grupos`;

    const confirmar = window.confirm(
      `🎾 Deseja gerar as chaves para a etapa "${etapa.nome}"?\n\n` +
        `Formato: ${formatoNome}\n\n` +
        `Isso criará:\n${detalhes}\n\n` +
        `⚠️ Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      if (isReiDaPraia) {
        await reiDaPraiaService.gerarChaves(etapa.id);
      } else {
        await chaveService.gerarChaves(etapa.id);
      }

      await carregarEtapa();
      alert("Chaves geradas com sucesso!");
      setAbaAtiva("chaves");
    } catch (err: any) {
      logger.error("Erro ao gerar chaves", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao gerar chaves");
      setLoading(false);
    }
  }, [etapa, isReiDaPraia, carregarEtapa]);

  /**
   * Apagar chaves
   */
  const handleApagarChaves = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `⚠️ ATENÇÃO: Deseja apagar todas as chaves desta etapa?\n\n` +
        `Isso removerá:\n` +
        `• Todos os grupos\n` +
        `• Todas as partidas\n` +
        `• Todos os resultados\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      // O endpoint DELETE /etapas/:id/chaves funciona para ambos os formatos
      await chaveService.excluirChaves(etapa.id);

      await carregarEtapa();
      alert("Chaves apagadas com sucesso!");
      setAbaAtiva("inscricoes");
    } catch (err: any) {
      logger.error("Erro ao apagar chaves", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao apagar chaves");
      setLoading(false);
    }
  }, [etapa, carregarEtapa]);

  // Carregar etapa ao montar
  useEffect(() => {
    carregarEtapa();
  }, [carregarEtapa]);

  return {
    // Estado
    etapa,
    loading,
    error,
    abaAtiva,
    modalInscricaoAberto,
    modalConfirmacaoAberto,

    // Flags derivadas
    isReiDaPraia,
    progresso,

    // Actions
    carregarEtapa,
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleFinalizarEtapa,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,
    handleGerarChaves,
    handleApagarChaves,

    // Modal handlers
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  };
};

export default useDetalhesEtapa;
