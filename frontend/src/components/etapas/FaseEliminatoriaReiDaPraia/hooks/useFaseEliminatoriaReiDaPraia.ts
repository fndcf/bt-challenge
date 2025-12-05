import { useState, useEffect, useMemo } from "react";
import { TipoFase, StatusConfrontoEliminatorio, Grupo } from "@/types/chave";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { getReiDaPraiaService, getEtapaService } from "@/services";

export interface ConfrontoEliminatorioReiDaPraia {
  id: string;
  etapaId: string;
  fase: TipoFase;
  ordem: number;
  dupla1Id?: string;
  dupla1Nome?: string;
  dupla1Origem?: string;
  dupla2Id?: string;
  dupla2Nome?: string;
  dupla2Origem?: string;
  vencedoraId?: string;
  vencedoraNome?: string;
  placar?: string;
  status: StatusConfrontoEliminatorio;
}

export interface UseFaseEliminatoriaReiDaPraiaProps {
  etapaId: string;
  grupos: Grupo[];
  etapaTipoChaveamento?: TipoChaveamentoReiDaPraia;
}

export interface UseFaseEliminatoriaReiDaPraiaReturn {
  // Estado
  confrontos: ConfrontoEliminatorioReiDaPraia[];
  loading: boolean;
  erro: string | null;
  confrontoSelecionado: ConfrontoEliminatorioReiDaPraia | null;
  faseAtual: TipoFase | "todas";
  etapaFinalizada: boolean;

  // Dados computados
  todosGruposCompletos: boolean;
  isGrupoUnico: boolean;
  partidasPendentes: number;
  finalFinalizada: boolean;
  grupoUnicoCompleto: boolean;
  tipoChaveamento: string;

  // Actions
  setConfrontoSelecionado: (
    confronto: ConfrontoEliminatorioReiDaPraia | null
  ) => void;
  setFaseAtual: (fase: TipoFase | "todas") => void;
  carregarConfrontos: () => Promise<void>;
  gerarEliminatoria: () => Promise<void>;
  cancelarEliminatoria: () => Promise<void>;
  encerrarEtapa: () => Promise<void>;
}

export const useFaseEliminatoriaReiDaPraia = ({
  etapaId,
  grupos,
  etapaTipoChaveamento,
}: UseFaseEliminatoriaReiDaPraiaProps): UseFaseEliminatoriaReiDaPraiaReturn => {
  const reiDaPraiaService = getReiDaPraiaService();
  const etapaService = getEtapaService();

  // Estados
  const [confrontos, setConfrontos] = useState<
    ConfrontoEliminatorioReiDaPraia[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confrontoSelecionado, setConfrontoSelecionado] =
    useState<ConfrontoEliminatorioReiDaPraia | null>(null);
  const [faseAtual, setFaseAtual] = useState<TipoFase | "todas">("todas");
  const [etapaFinalizada, setEtapaFinalizada] = useState(false);

  // Tipo de chaveamento formatado
  const tipoChaveamento = useMemo(() => {
    if (!etapaTipoChaveamento) return "Melhores com Melhores";

    const nomes: Record<TipoChaveamentoReiDaPraia, string> = {
      [TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES]:
        "Melhores com Melhores",
      [TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING]:
        "Pareamento por Ranking",
      [TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO]: "Sorteio Aleatório",
    };

    return nomes[etapaTipoChaveamento] || "Melhores com Melhores";
  }, [etapaTipoChaveamento]);

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
   * Carrega os confrontos eliminatórios do Rei da Praia
   */
  const carregarConfrontos = async () => {
    try {
      setLoading(true);
      setErro(null);

      // Sempre buscar todos os confrontos (filtragem será feita no frontend)
      const dados = await reiDaPraiaService.buscarConfrontosEliminatorios(
        etapaId
      );
      setConfrontos(dados);
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar confrontos");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gera a fase eliminatória Rei da Praia
   */
  const gerarEliminatoria = async () => {
    try {
      setLoading(true);

      // Calcular quantos classificam por grupo (padrão: metade do grupo = 2 de cada grupo de 4)
      const classificadosPorGrupo = 2;

      // Usar o tipo de chaveamento da etapa ou padrão (MELHORES_COM_MELHORES)
      const tipoChaveamentoAtual =
        etapaTipoChaveamento || TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES;

      await reiDaPraiaService.gerarEliminatoria(etapaId, {
        classificadosPorGrupo,
        tipoChaveamento: tipoChaveamentoAtual,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Fase eliminatória Rei da Praia gerada com sucesso!");
      await carregarConfrontos();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela a fase eliminatória
   */
  const cancelarEliminatoria = async () => {
    try {
      setLoading(true);
      await reiDaPraiaService.cancelarEliminatoria(etapaId);
      alert("Fase eliminatória cancelada!");
      await carregarConfrontos();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Encerra a etapa
   */
  const encerrarEtapa = async () => {
    try {
      setLoading(true);
      await etapaService.encerrarEtapa(etapaId);
      alert("Etapa Rei da Praia encerrada com sucesso!");
      window.location.reload();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
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

    // Dados computados
    todosGruposCompletos,
    isGrupoUnico,
    partidasPendentes,
    finalFinalizada,
    grupoUnicoCompleto,
    tipoChaveamento,

    // Actions
    setConfrontoSelecionado,
    setFaseAtual,
    carregarConfrontos,
    gerarEliminatoria,
    cancelarEliminatoria,
    encerrarEtapa,
  };
};
