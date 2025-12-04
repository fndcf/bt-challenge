/**
 * useEtapaInscricoes.ts
 *
 * Responsabilidade única: Gerenciar ações de inscrição de etapas
 *
 * SOLID aplicado:
 * - SRP: Hook focado apenas em operações de inscrição
 * - DIP: Depende de IEtapaService (abstração)
 * - OCP: Aberto para extensão (novas ações podem ser adicionadas)
 */

import { useCallback } from "react";
import { Etapa } from "@/types/etapa";
import { getEtapaService } from "@/services";
import logger from "@/utils/logger";

export interface UseEtapaInscricoesParams {
  etapa: Etapa | null;
  onSuccess?: () => void | Promise<void>;
}

export interface UseEtapaInscricoesReturn {
  handleAbrirInscricoes: () => Promise<void>;
  handleEncerrarInscricoes: () => Promise<void>;
  handleFinalizarEtapa: () => Promise<void>;
  handleCancelarInscricao: (
    inscricaoId: string,
    jogadorNome: string
  ) => Promise<void>;
  handleCancelarMultiplosInscricoes: (inscricaoIds: string[]) => Promise<void>;
}

/**
 * Hook para gerenciar ações relacionadas a inscrições
 *
 * @param params - Parâmetros contendo etapa e callback de sucesso
 * @returns Funções para gerenciar inscrições
 */
export const useEtapaInscricoes = ({
  etapa,
  onSuccess,
}: UseEtapaInscricoesParams): UseEtapaInscricoesReturn => {
  /**
   * Abrir/Reabrir inscrições
   */
  const handleAbrirInscricoes = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `Deseja reabrir as inscrições para "${etapa.nome}"?\n\n` +
        `Os jogadores poderão se inscrever novamente.`
    );

    if (!confirmar) return;

    try {
      const etapaService = getEtapaService();
      await etapaService.reabrirInscricoes(etapa.id);

      if (onSuccess) await onSuccess();

      alert("Inscrições reabertas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao reabrir inscrições", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao reabrir inscrições");
      throw err;
    }
  }, [etapa, onSuccess]);

  /**
   * Encerrar inscrições
   */
  const handleEncerrarInscricoes = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `Deseja encerrar as inscrições para "${etapa.nome}"?\n\n` +
        `Após encerrar, novos jogadores não poderão se inscrever.`
    );

    if (!confirmar) return;

    try {
      const etapaService = getEtapaService();
      await etapaService.encerrarInscricoes(etapa.id);

      if (onSuccess) await onSuccess();

      alert("Inscrições encerradas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao encerrar inscrições", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao encerrar inscrições");
      throw err;
    }
  }, [etapa, onSuccess]);

  /**
   * Finalizar etapa
   */
  const handleFinalizarEtapa = useCallback(async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `Deseja finalizar a etapa "${etapa.nome}"?\n\n` +
        `Isso marcará a etapa como concluída.`
    );

    if (!confirmar) return;

    try {
      const etapaService = getEtapaService();
      await etapaService.encerrarEtapa(etapa.id);

      if (onSuccess) await onSuccess();

      alert("Etapa finalizada com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao finalizar etapa", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao finalizar etapa");
      throw err;
    }
  }, [etapa, onSuccess]);

  /**
   * Cancelar inscrição individual
   */
  const handleCancelarInscricao = useCallback(
    async (inscricaoId: string, jogadorNome: string) => {
      if (!etapa) return;

      const confirmar = window.confirm(
        `Deseja cancelar a inscrição de ${jogadorNome}?`
      );

      if (!confirmar) return;

      try {
        const etapaService = getEtapaService();
        await etapaService.cancelarInscricao(etapa.id, inscricaoId);

        if (onSuccess) await onSuccess();

        alert("Inscrição cancelada com sucesso!");
      } catch (err: any) {
        logger.error(
          "Erro ao cancelar inscrição",
          { etapaId: etapa.id, inscricaoId },
          err
        );
        alert(err.message || "Erro ao cancelar inscrição");
        throw err;
      }
    },
    [etapa, onSuccess]
  );

  /**
   * Cancelar múltiplas inscrições
   */
  const handleCancelarMultiplosInscricoes = useCallback(
    async (inscricaoIds: string[]) => {
      if (!etapa) return;

      try {
        const etapaService = getEtapaService();

        // Cancelar sequencialmente para evitar sobrecarga
        for (const inscricaoId of inscricaoIds) {
          await etapaService.cancelarInscricao(etapa.id, inscricaoId);
        }

        if (onSuccess) await onSuccess();

        alert(
          `${inscricaoIds.length} inscrição(ões) cancelada(s) com sucesso!`
        );
      } catch (err: any) {
        logger.error(
          "Erro ao cancelar múltiplas inscrições",
          { etapaId: etapa.id, count: inscricaoIds.length },
          err
        );
        throw err; // Re-throw para o componente tratar
      }
    },
    [etapa, onSuccess]
  );

  return {
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleFinalizarEtapa,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,
  };
};

export default useEtapaInscricoes;
