import { useState, useEffect, useMemo } from "react";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "@/types/chave";
import { getChaveService, getEtapaService } from "@/services";
import { invalidateRankingCache } from "@/components/jogadores/RankingList";

export interface UseFaseEliminatoriaProps {
  etapaId: string;
  grupos: Grupo[];
}

export interface UseFaseEliminatoriaReturn {
  // Estado
  confrontos: ConfrontoEliminatorio[];
  loading: boolean;
  erro: string | null;
  confrontoSelecionado: ConfrontoEliminatorio | null;
  faseAtual: TipoFase | "todas";
  etapaFinalizada: boolean;
  globalLoading: boolean;
  globalLoadingMessage: string;

  // Dados computados
  todosGruposCompletos: boolean;
  isGrupoUnico: boolean;
  partidasPendentes: number;
  finalFinalizada: boolean;
  grupoUnicoCompleto: boolean;

  // Actions
  setConfrontoSelecionado: (confronto: ConfrontoEliminatorio | null) => void;
  setFaseAtual: (fase: TipoFase | "todas") => void;
  carregarConfrontos: () => Promise<void>;
  gerarEliminatoria: () => Promise<void>;
  cancelarEliminatoria: () => Promise<void>;
  encerrarEtapa: () => Promise<void>;
}

export const useFaseEliminatoria = ({
  etapaId,
  grupos,
}: UseFaseEliminatoriaProps): UseFaseEliminatoriaReturn => {
  const chaveService = getChaveService();
  const etapaService = getEtapaService();

  // Estados
  const [confrontos, setConfrontos] = useState<ConfrontoEliminatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confrontoSelecionado, setConfrontoSelecionado] =
    useState<ConfrontoEliminatorio | null>(null);
  const [faseAtual, setFaseAtual] = useState<TipoFase | "todas">("todas");
  const [etapaFinalizada, setEtapaFinalizada] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState("");

  // Dados computados
  const todosGruposCompletos = useMemo(() => {
    if (!grupos || grupos.length === 0) return false;
    return grupos.every((g) => g.completo);
  }, [grupos]);

  const isGrupoUnico = useMemo(() => {
    return grupos && grupos.length === 1;
  }, [grupos]);

  const partidasPendentes = useMemo(() => {
    if (!grupos) return 0;
    return grupos.reduce((total, g) => {
      return total + (g.totalPartidas - g.partidasFinalizadas);
    }, 0);
  }, [grupos]);

  const finalFinalizada = useMemo(() => {
    if (!confrontos || confrontos.length === 0) return false;
    const confrontoFinal = confrontos.find((c) => c.fase === TipoFase.FINAL);
    if (!confrontoFinal) return false;
    return confrontoFinal.status === StatusConfrontoEliminatorio.FINALIZADA;
  }, [confrontos]);

  const grupoUnicoCompleto = useMemo(() => {
    if (!isGrupoUnico) return false;
    return grupos[0]?.completo || false;
  }, [isGrupoUnico, grupos]);

  // Verificar status da etapa ao montar
  useEffect(() => {
    const verificarStatusEtapa = async () => {
      try {
        const etapa = await etapaService.buscarPorId(etapaId);
        if (etapa) {
          setEtapaFinalizada(etapa.status === "finalizada");
        }
      } catch (error) {
        // Silently fail - não é crítico
      }
    };

    verificarStatusEtapa();
  }, [etapaId]);

  // Carregar confrontos quando etapaId mudar
  useEffect(() => {
    carregarConfrontos();
  }, [etapaId]);

  /**
   * Carrega os confrontos eliminatórios
   */
  const carregarConfrontos = async () => {
    try {
      setLoading(true);
      setErro(null);

      // Sempre buscar todos os confrontos (sem filtro de fase)
      const dados = await chaveService.buscarConfrontosEliminatorios(
        etapaId,
        undefined
      );

      setConfrontos(dados);
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar confrontos");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gera a fase eliminatória
   */
  const gerarEliminatoria = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Gerando fase eliminatória...");
      await chaveService.gerarFaseEliminatoria(etapaId, 2);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Fase eliminatória gerada com sucesso!");
      await carregarConfrontos();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  /**
   * Cancela a fase eliminatória
   */
  const cancelarEliminatoria = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Cancelando eliminatória...");
      await chaveService.cancelarFaseEliminatoria(etapaId);
      alert("Fase eliminatória cancelada!");
      await carregarConfrontos();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  /**
   * Encerra a etapa
   */
  const encerrarEtapa = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Encerrando etapa e atribuindo pontos...");
      await etapaService.encerrarEtapa(etapaId);
      // Invalidar cache do ranking pois os pontos foram atualizados
      invalidateRankingCache();
      alert("Etapa encerrada com sucesso!");
      window.location.reload();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  return {
    // Estado
    confrontos,
    loading,
    erro,
    confrontoSelecionado,
    faseAtual,
    etapaFinalizada,
    globalLoading,
    globalLoadingMessage,

    // Dados computados
    todosGruposCompletos,
    isGrupoUnico,
    partidasPendentes,
    finalFinalizada,
    grupoUnicoCompleto,

    // Actions
    setConfrontoSelecionado,
    setFaseAtual,
    carregarConfrontos,
    gerarEliminatoria,
    cancelarEliminatoria,
    encerrarEtapa,
  };
};
