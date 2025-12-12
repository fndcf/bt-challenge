/**
 * Responsabilidade única: Gerenciar ações de chaveamento de etapas
 */

import { useCallback } from "react";
import { Etapa, FormatoEtapa, TipoFormacaoEquipe } from "@/types/etapa";
import { getChaveService, getReiDaPraiaService, getSuperXService, getTeamsService } from "@/services";
import { FormacaoManualEquipeDTO } from "@/types/teams";
import logger from "@/utils/logger";

export interface UseEtapaChavesParams {
  etapa: Etapa | null;
  onSuccess?: (
    aba?: "inscricoes" | "chaves" | "cabeças"
  ) => void | Promise<void>;
}

export interface UseEtapaChavesReturn {
  handleGerarChaves: () => Promise<void>;
  handleGerarChavesManual: (formacoes: FormacaoManualEquipeDTO[]) => Promise<void>;
  handleApagarChaves: () => Promise<void>;
  isFormacaoManual: boolean;
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
  const isSuperX = etapa?.formato === FormatoEtapa.SUPER_X;
  const isTeams = etapa?.formato === FormatoEtapa.TEAMS;
  const isFormacaoManual = isTeams && etapa?.tipoFormacaoEquipe === TipoFormacaoEquipe.MANUAL;

  /**
   * Gerar chaves
   */
  const handleGerarChaves = useCallback(async () => {
    if (!etapa) return;

    // Determinar nome e detalhes do formato
    let formatoNome = "Dupla Fixa";
    let detalhes = "";

    if (isTeams) {
      const variante = etapa.varianteTeams || 4;
      const numEquipes = Math.floor(etapa.totalInscritos / variante);
      const numConfrontos = (numEquipes * (numEquipes - 1)) / 2;
      formatoNome = `TEAMS ${variante}`;
      detalhes =
        `• ${numEquipes} equipes de ${variante} jogadores\n` +
        `• ${numConfrontos} confrontos (todos contra todos)\n` +
        `• ${variante === 4 ? "2 jogos por confronto (+decider se 1-1)" : "3 jogos por confronto"}\n` +
        `• Vitoria no confronto = 3 pontos`;
    } else if (isSuperX) {
      const variante = etapa.varianteSuperX || 8;
      const rodadas = variante === 8 ? 7 : 11; // Super 8: 7 rodadas, Super 12: 11 rodadas
      const partidasPorRodada = variante === 12 ? 3 : 2;
      formatoNome = `Super ${variante}`;
      detalhes =
        `• 1 grupo único com ${variante} jogadores\n` +
        `• ${rodadas} rodadas com duplas rotativas\n` +
        `• ${rodadas * partidasPorRodada} partidas no total\n` +
        `• Estatísticas individuais por jogador`;
    } else if (isReiDaPraia) {
      formatoNome = "Rei da Praia";
      detalhes =
        `• ${etapa.totalInscritos / 4} grupos de 4 jogadores\n` +
        `• ${(etapa.totalInscritos / 4) * 3} partidas na fase de grupos\n` +
        `• Estatísticas individuais por jogador`;
    } else {
      detalhes =
        `• ${etapa.qtdGrupos} grupos\n` +
        `• ${Math.floor(etapa.totalInscritos / 2)} duplas\n` +
        `• Todos os confrontos da fase de grupos`;
    }

    const confirmar = window.confirm(
      `Deseja gerar as chaves para a etapa "${etapa.nome}"?\n\n` +
        `Formato: ${formatoNome}\n\n` +
        `Isso criará:\n${detalhes}\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      if (isTeams) {
        const teamsService = getTeamsService();
        await teamsService.gerarEquipes(etapa.id);
      } else if (isSuperX) {
        const superXService = getSuperXService();
        await superXService.gerarChaves(etapa.id);
      } else if (isReiDaPraia) {
        const reiDaPraiaService = getReiDaPraiaService();
        await reiDaPraiaService.gerarChaves(etapa.id);
      } else {
        const chaveService = getChaveService();
        await chaveService.gerarChaves(etapa.id);
      }

      if (onSuccess) await onSuccess("chaves");

      alert(isTeams ? "Equipes e confrontos gerados com sucesso!" : "Chaves geradas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao gerar chaves", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao gerar chaves");
      throw err;
    }
  }, [etapa, isReiDaPraia, isSuperX, isTeams, onSuccess]);

  /**
   * Apagar chaves (sem confirmação - a confirmação deve ser feita pelo componente)
   */
  const handleApagarChaves = useCallback(async () => {
    if (!etapa) return;

    try {
      if (isTeams) {
        const teamsService = getTeamsService();
        await teamsService.cancelarChaves(etapa.id);
      } else if (isSuperX) {
        const superXService = getSuperXService();
        await superXService.cancelarChaves(etapa.id);
      } else {
        // O endpoint DELETE /etapas/:id/chaves funciona para ambos os formatos (Dupla Fixa e Rei da Praia)
        const chaveService = getChaveService();
        await chaveService.excluirChaves(etapa.id);
      }

      if (onSuccess) await onSuccess("inscricoes");

      alert(isTeams ? "Equipes e confrontos apagados com sucesso!" : "Chaves apagadas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao apagar chaves", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao apagar chaves");
      throw err;
    }
  }, [etapa, isSuperX, isTeams, onSuccess]);

  /**
   * Gerar equipes manualmente (TEAMS com formação manual)
   */
  const handleGerarChavesManual = useCallback(async (formacoes: FormacaoManualEquipeDTO[]) => {
    if (!etapa || !isTeams) return;

    try {
      const teamsService = getTeamsService();
      await teamsService.formarEquipesManual(etapa.id, { formacoes });

      if (onSuccess) await onSuccess("chaves");

      alert("Equipes formadas com sucesso!");
    } catch (err: any) {
      logger.error("Erro ao formar equipes manualmente", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao formar equipes");
      throw err;
    }
  }, [etapa, isTeams, onSuccess]);

  return {
    handleGerarChaves,
    handleGerarChavesManual,
    handleApagarChaves,
    isFormacaoManual,
  };
};

export default useEtapaChaves;
