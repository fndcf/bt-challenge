/**
 * Responsabilidade única: Gerenciar ações de chaveamento de etapas
 */

import { useCallback } from "react";
import { Etapa, FormatoEtapa } from "@/types/etapa";
import { getChaveService, getReiDaPraiaService } from "@/services";
import logger from "@/utils/logger";

export interface UseEtapaChavesParams {
  etapa: Etapa | null;
  onSuccess?: (
    aba?: "inscricoes" | "chaves" | "cabeças"
  ) => void | Promise<void>;
}

export interface UseEtapaChavesReturn {
  handleGerarChaves: () => Promise<void>;
  handleApagarChaves: () => Promise<void>;
}

/**
 * Hook para gerenciar ações relacionadas a chaves
 *
 * @param params - Parâmetros contendo etapa e callback de sucesso
 * @returns Funções para gerenciar chaves
 */
export const useEtapaChaves = ({
  etapa,
  onSuccess,
}: UseEtapaChavesParams): UseEtapaChavesReturn => {
  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;

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
      `Deseja gerar as chaves para a etapa "${etapa.nome}"?\n\n` +
        `Formato: ${formatoNome}\n\n` +
        `Isso criará:\n${detalhes}\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      if (isReiDaPraia) {
        const reiDaPraiaService = getReiDaPraiaService();
        await reiDaPraiaService.gerarChaves(etapa.id);
      } else {
        const chaveService = getChaveService();
        await chaveService.gerarChaves(etapa.id);
      }

      if (onSuccess) await onSuccess("chaves");

      alert("Chaves geradas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao gerar chaves", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao gerar chaves");
      throw err;
    }
  }, [etapa, isReiDaPraia, onSuccess]);

  /**
   * Apagar chaves (sem confirmação - a confirmação deve ser feita pelo componente)
   */
  const handleApagarChaves = useCallback(async () => {
    if (!etapa) return;

    try {
      // O endpoint DELETE /etapas/:id/chaves funciona para ambos os formatos
      const chaveService = getChaveService();
      await chaveService.excluirChaves(etapa.id);

      if (onSuccess) await onSuccess("inscricoes");

      alert("Chaves apagadas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao apagar chaves", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao apagar chaves");
      throw err;
    }
  }, [etapa, onSuccess]);

  return {
    handleGerarChaves,
    handleApagarChaves,
  };
};

export default useEtapaChaves;
