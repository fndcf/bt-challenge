/**
 * useListagemEtapas.ts
 *
 * Responsabilidade única: Gerenciar estado e lógica de negócio da listagem de etapas
 */

import { useState, useEffect, useCallback } from "react";
import { Etapa, StatusEtapa, FiltrosEtapa, FormatoEtapa } from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getEtapaService } from "@/services";
import logger from "@/utils/logger";

export interface EstatisticasEtapas {
  totalEtapas: number;
  inscricoesAbertas: number;
  emAndamento: number;
  finalizadas: number;
  reiDaPraia: number;
  duplaFixa: number;
}

export interface UseListagemEtapasReturn {
  // Estado
  etapas: Etapa[];
  loading: boolean;
  error: string | null;
  stats: EstatisticasEtapas;

  // Filtros
  filtroStatus: StatusEtapa | "";
  filtroNivel: NivelJogador | "";
  filtroGenero: GeneroJogador | "";
  filtroFormato: FormatoEtapa | "";
  ordenacao: "dataRealizacao" | "criadoEm";

  // Paginação
  paginaAtual: number;
  totalPaginas: number;
  totalEtapas: number;
  etapasPorPagina: number;

  // Actions
  setFiltroStatus: (status: StatusEtapa | "") => void;
  setFiltroNivel: (nivel: NivelJogador | "") => void;
  setFiltroGenero: (genero: GeneroJogador | "") => void;
  setFiltroFormato: (formato: FormatoEtapa | "") => void;
  setOrdenacao: (ordenacao: "dataRealizacao" | "criadoEm") => void;
  limparFiltros: () => void;
  recarregar: () => void;
  proximaPagina: () => void;
  paginaAnterior: () => void;
  irParaPagina: (pagina: number) => void;

  // Helpers
  temFiltrosAtivos: boolean;
}

export const useListagemEtapas = (): UseListagemEtapasReturn => {
  // Estado das etapas
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<StatusEtapa | "">("");
  const [filtroNivel, setFiltroNivel] = useState<NivelJogador | "">("");
  const [filtroGenero, setFiltroGenero] = useState<GeneroJogador | "">("");
  const [filtroFormato, setFiltroFormato] = useState<FormatoEtapa | "">("");
  const [ordenacao, setOrdenacao] = useState<"dataRealizacao" | "criadoEm">(
    "dataRealizacao"
  );

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalEtapas, setTotalEtapas] = useState(0);
  const etapasPorPagina = 12;

  // Estatísticas
  const [stats, setStats] = useState<EstatisticasEtapas>({
    totalEtapas: 0,
    inscricoesAbertas: 0,
    emAndamento: 0,
    finalizadas: 0,
    reiDaPraia: 0,
    duplaFixa: 0,
  });

  // Calcular total de páginas
  const totalPaginas = Math.ceil(totalEtapas / etapasPorPagina);

  // Verificar se há filtros ativos
  const temFiltrosAtivos =
    filtroStatus !== "" ||
    filtroNivel !== "" ||
    filtroGenero !== "" ||
    filtroFormato !== "" ||
    ordenacao !== "dataRealizacao";

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info("Carregando listagem de etapas", {
        filtros: {
          status: filtroStatus,
          nivel: filtroNivel,
          genero: filtroGenero,
          formato: filtroFormato,
          ordenacao,
        },
        paginacao: {
          pagina: paginaAtual,
          limite: etapasPorPagina,
        },
      });

      const offset = (paginaAtual - 1) * etapasPorPagina;

      const filtros: FiltrosEtapa = {
        ordenarPor: ordenacao,
        ordem: "desc",
        limite: etapasPorPagina,
        offset,
      };

      if (filtroStatus) {
        filtros.status = filtroStatus;
      }

      if (filtroNivel) {
        filtros.nivel = filtroNivel;
      }

      if (filtroGenero) {
        filtros.genero = filtroGenero;
      }

      if (filtroFormato) {
        filtros.formato = filtroFormato;
      }

      const etapaService = getEtapaService();
      const [resultado, estatisticas, todasEtapas] = await Promise.all([
        etapaService.listar(filtros),
        etapaService.obterEstatisticas(),
        etapaService.listar({ ordenarPor: "dataRealizacao", ordem: "desc", limite: 1000 }), // Buscar todas para contagem de formatos
      ]);

      setEtapas(resultado.etapas);
      setTotalEtapas(resultado.total);

      // Calcular estatísticas por formato usando TODAS as etapas (sem filtros)
      const reiDaPraiaCount = todasEtapas.etapas.filter(
        (e) => e.formato === FormatoEtapa.REI_DA_PRAIA
      ).length;

      setStats({
        ...estatisticas,
        reiDaPraia: reiDaPraiaCount,
        duplaFixa: todasEtapas.etapas.length - reiDaPraiaCount,
      });

      logger.info("Etapas carregadas com sucesso", {
        total: resultado.total,
        exibindo: resultado.etapas.length,
        pagina: paginaAtual,
        totalPaginas: Math.ceil(resultado.total / etapasPorPagina),
        stats: estatisticas,
      });
    } catch (err: any) {
      const mensagemErro =
        err.response?.data?.error || "Erro ao carregar etapas";
      setError(mensagemErro);
      logger.error(
        "Erro ao carregar listagem de etapas",
        {
          filtros: {
            status: filtroStatus,
            nivel: filtroNivel,
            genero: filtroGenero,
            formato: filtroFormato,
            ordenacao,
          },
          paginacao: {
            pagina: paginaAtual,
            limite: etapasPorPagina,
          },
        },
        err
      );
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, filtroNivel, filtroGenero, filtroFormato, ordenacao, paginaAtual]);

  // Limpar filtros
  const limparFiltros = useCallback(() => {
    logger.info("Limpando filtros da listagem de etapas");
    setFiltroStatus("");
    setFiltroNivel("");
    setFiltroGenero("");
    setFiltroFormato("");
    setOrdenacao("dataRealizacao");
    setPaginaAtual(1); // Volta para primeira página
  }, []);

  // Recarregar dados
  const recarregar = useCallback(() => {
    logger.info("Recarregando listagem de etapas");
    carregarDados();
  }, [carregarDados]);

  // Funções de paginação
  const proximaPagina = useCallback(() => {
    if (paginaAtual < totalPaginas) {
      logger.info("Navegando para próxima página", {
        paginaAtual,
        proximaPagina: paginaAtual + 1,
      });
      setPaginaAtual((prev) => prev + 1);
    }
  }, [paginaAtual, totalPaginas]);

  const paginaAnterior = useCallback(() => {
    if (paginaAtual > 1) {
      logger.info("Navegando para página anterior", {
        paginaAtual,
        paginaAnterior: paginaAtual - 1,
      });
      setPaginaAtual((prev) => prev - 1);
    }
  }, [paginaAtual]);

  const irParaPagina = useCallback(
    (pagina: number) => {
      if (pagina >= 1 && pagina <= totalPaginas) {
        logger.info("Navegando para página específica", {
          paginaAtual,
          novaPagina: pagina,
        });
        setPaginaAtual(pagina);
      }
    },
    [paginaAtual, totalPaginas]
  );

  // Effect para resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, filtroNivel, filtroGenero, filtroFormato, ordenacao]);

  // Effect para carregar dados quando filtros ou página mudarem
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return {
    // Estado
    etapas,
    loading,
    error,
    stats,

    // Filtros
    filtroStatus,
    filtroNivel,
    filtroGenero,
    filtroFormato,
    ordenacao,

    // Paginação
    paginaAtual,
    totalPaginas,
    totalEtapas,
    etapasPorPagina,

    // Actions
    setFiltroStatus,
    setFiltroNivel,
    setFiltroGenero,
    setFiltroFormato,
    setOrdenacao,
    limparFiltros,
    recarregar,
    proximaPagina,
    paginaAnterior,
    irParaPagina,

    // Helpers
    temFiltrosAtivos,
  };
};

export default useListagemEtapas;
