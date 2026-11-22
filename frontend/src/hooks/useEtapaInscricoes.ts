/**
 * Responsabilidade única: Gerenciar ações de inscrição de etapas
 */

import { useCallback } from "react";
import { Etapa } from "@/types/etapa";
import { getEtapaService } from "@/services";
import logger from "@/utils/logger";
import { invalidateRankingCache } from "@/components/jogadores/RankingList";
import {
  avisarAtencao,
  avisarErro,
  avisarSucesso,
  confirmar,
} from "@/utils/dialogos";
import { getMensagemErro, paraError } from "@/utils/erro";

export type ComLoading = (
  mensagem: string,
  executar: () => Promise<unknown>
) => Promise<void>;

export const semLoading: ComLoading = async (_mensagem, executar) => {
  await executar();
};

export interface UseEtapaInscricoesParams {
  etapa: Etapa | null;
  onSuccess?: () => void | Promise<void>;
  /** Bloqueia a tela enquanto executa, depois da confirmação */
  comLoading?: ComLoading;
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
  comLoading = semLoading,
}: UseEtapaInscricoesParams): UseEtapaInscricoesReturn => {
  /**
   * Abrir/Reabrir inscrições
   */
  const handleAbrirInscricoes = useCallback(async () => {
    if (!etapa) return;

    const confirmou = await confirmar({
      titulo: "Reabrir Inscrições",
      mensagem:
        `Deseja reabrir as inscrições para "${etapa.nome}"?\n\n` +
        `Os jogadores poderão se inscrever novamente.`,
      textoConfirmar: "Reabrir Inscrições",
    });

    if (!confirmou) return;

    try {
      const etapaService = getEtapaService();
      await comLoading("Reabrindo inscrições...", async () => {
        await etapaService.reabrirInscricoes(etapa.id);

        if (onSuccess) await onSuccess();
      });

      avisarSucesso("Inscrições reabertas com sucesso!");
    } catch (err) {
      logger.error("Erro ao reabrir inscrições", { etapaId: etapa.id }, paraError(err));
      avisarErro(getMensagemErro(err, "Erro ao reabrir inscrições"));
      throw err;
    }
  }, [etapa, onSuccess, comLoading]);

  /**
   * Encerrar inscrições
   */
  const handleEncerrarInscricoes = useCallback(async () => {
    if (!etapa) return;

    const confirmou = await confirmar({
      titulo: "Encerrar Inscrições",
      mensagem:
        `Deseja encerrar as inscrições para "${etapa.nome}"?\n\n` +
        `Após encerrar, novos jogadores não poderão se inscrever.`,
      textoConfirmar: "Encerrar Inscrições",
    });

    if (!confirmou) return;

    try {
      const etapaService = getEtapaService();
      await comLoading("Encerrando inscrições...", async () => {
        await etapaService.encerrarInscricoes(etapa.id);

        if (onSuccess) await onSuccess();
      });

      avisarSucesso("Inscrições encerradas com sucesso!");
    } catch (err) {
      logger.error("Erro ao encerrar inscrições", { etapaId: etapa.id }, paraError(err));
      avisarErro(getMensagemErro(err, "Erro ao encerrar inscrições"));
      throw err;
    }
  }, [etapa, onSuccess, comLoading]);

  /**
   * Finalizar etapa
   */
  const handleFinalizarEtapa = useCallback(async () => {
    if (!etapa) return;

    const confirmou = await confirmar({
      titulo: "Finalizar Etapa",
      mensagem:
        `Deseja finalizar a etapa "${etapa.nome}"?\n\n` +
        `Isso marcará a etapa como concluída.`,
      textoConfirmar: "Finalizar Etapa",
    });

    if (!confirmou) return;

    try {
      const etapaService = getEtapaService();
      await comLoading("Finalizando etapa...", async () => {
        await etapaService.encerrarEtapa(etapa.id);

        // Invalidar cache do ranking pois os pontos foram atualizados
        invalidateRankingCache();

        if (onSuccess) await onSuccess();
      });

      avisarSucesso("Etapa finalizada com sucesso!");
    } catch (err) {
      logger.error("Erro ao finalizar etapa", { etapaId: etapa.id }, paraError(err));
      avisarErro(getMensagemErro(err, "Erro ao finalizar etapa"));
      throw err;
    }
  }, [etapa, onSuccess, comLoading]);

  /**
   * Cancelar inscrição individual (usa método em lote internamente)
   */
  const handleCancelarInscricao = useCallback(
    async (inscricaoId: string, jogadorNome: string) => {
      if (!etapa) return;

      const confirmou = await confirmar({
        titulo: "Excluir Inscrição",
        mensagem: `Deseja excluir a inscrição de ${jogadorNome}?`,
        textoConfirmar: "Excluir Inscrição",
        perigo: true,
      });

      if (!confirmou) return;

      try {
        const etapaService = getEtapaService();
        await comLoading("Cancelando inscrição...", async () => {
          await etapaService.cancelarInscricoesEmLote(etapa.id, [inscricaoId]);

          if (onSuccess) await onSuccess();
        });

        avisarSucesso("Inscrição cancelada com sucesso!");
      } catch (err) {
        logger.error(
          "Erro ao cancelar inscrição",
          { etapaId: etapa.id, inscricaoId },
          paraError(err)
        );
        avisarErro(getMensagemErro(err, "Erro ao cancelar inscrição"));
        throw err;
      }
    },
    [etapa, onSuccess, comLoading]
  );

  /**
   * Cancelar múltiplas inscrições (batch)
   */
  const handleCancelarMultiplosInscricoes = useCallback(
    async (inscricaoIds: string[]) => {
      if (!etapa) return;

      try {
        const etapaService = getEtapaService();

        // Usar método batch para cancelar todas de uma vez
        const resultado = await etapaService.cancelarInscricoesEmLote(
          etapa.id,
          inscricaoIds
        );

        if (onSuccess) await onSuccess();

        if (resultado.erros.length > 0) {
          logger.warn("Alguns cancelamentos falharam", {
            etapaId: etapa.id,
            canceladas: resultado.canceladas,
            erros: resultado.erros,
          });
          avisarAtencao(
            `${resultado.canceladas} inscrição(ões) cancelada(s).\n` +
              `${resultado.erros.length} erro(s): ${resultado.erros.join(", ")}`
          );
        } else {
          avisarSucesso(
            `${resultado.canceladas} inscrição(ões) cancelada(s) com sucesso!`
          );
        }
      } catch (err) {
        logger.error(
          "Erro ao cancelar múltiplas inscrições",
          { etapaId: etapa.id, count: inscricaoIds.length },
          paraError(err)
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
