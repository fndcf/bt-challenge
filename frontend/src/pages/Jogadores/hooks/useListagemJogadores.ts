/**
 * Responsabilidade única: Gerenciar estado e lógica de negócio da listagem de jogadores
 */

import { useState, useEffect, useCallback } from "react";
import { useArena } from "@/contexts/ArenaContext";
import { getJogadorService } from "@/services";
import logger from "@/utils/logger";
import {
  Jogador,
  FiltrosJogador,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
} from "@/types/jogador";
import { Arena } from "@/types/arena";
import { getMensagemErro, paraError } from "@/utils/erro";

export interface UseListagemJogadoresReturn {
  // Estados principais
  jogadores: Jogador[];
  loading: boolean;
  arena: Arena | null;

  // Mensagens
  errorMessage: string;
  successMessage: string;
  setErrorMessage: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;

  // Filtros
  busca: string;
  setBusca: (value: string) => void;
  nivelFiltro: NivelJogador | "";
  setNivelFiltro: (value: NivelJogador | "") => void;
  statusFiltro: StatusJogador | "";
  setStatusFiltro: (value: StatusJogador | "") => void;
  generoFiltro: GeneroJogador | "";
  setGeneroFiltro: (value: GeneroJogador | "") => void;
  limparFiltros: () => void;
  temFiltrosAtivos: boolean;

  // Paginação
  total: number;
  offset: number;
  limite: number;
  temMais: boolean;
  paginaAtual: number;
  totalPaginas: number;
  handlePaginaAnterior: () => void;
  handleProximaPagina: () => void;
  irParaPagina: (pagina: number) => void;

  // Ações
  carregarJogadores: () => void;
  handleDeletarJogador: (jogador: Jogador) => Promise<boolean>;

  // Import/Export
  exportando: boolean;
  handleExportarExcel: () => Promise<void>;
  handleImportarExcel: (file: File) => Promise<{ criados: number; ignorados: string[] }>;
}

export const useListagemJogadores = (): UseListagemJogadoresReturn => {
  // Estados principais
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  // A arena ativa: é dela a lista, e é o slug dela que vai no link "Ver"
  const { arena } = useArena();

  // Mensagens
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Import/Export
  const [exportando, setExportando] = useState(false);

  // Filtros
  const [busca, setBusca] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<NivelJogador | "">("");
  const [statusFiltro, setStatusFiltro] = useState<StatusJogador | "">("");
  const [generoFiltro, setGeneroFiltro] = useState<GeneroJogador | "">("");

  // Paginação
  const [total, setTotal] = useState(0);
  const [limite] = useState(12);
  const [offset, setOffset] = useState(0);
  const [temMais, setTemMais] = useState(false);

  const paginaAtual = Math.floor(offset / limite) + 1;
  const totalPaginas = Math.ceil(total / limite);

  const temFiltrosAtivos = !!(
    busca ||
    nivelFiltro ||
    statusFiltro ||
    generoFiltro
  );

  /**
   * Carregar jogadores
   */
  const carregarJogadores = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      logger.info("Carregando jogadores", {
        busca,
        nivelFiltro,
        statusFiltro,
        generoFiltro,
        offset,
        limite,
      });

      const filtros: FiltrosJogador = {
        busca: busca || undefined,
        nivel: nivelFiltro || undefined,
        status: statusFiltro || undefined,
        genero: generoFiltro || undefined,
        limite,
        offset,
        ordenarPor: "nome",
        ordem: "asc",
      };

      const jogadorService = getJogadorService();
      const resultado = await jogadorService.listar(filtros);

      setJogadores(resultado.jogadores);
      setTotal(resultado.total);
      setTemMais(resultado.temMais);

      logger.info("Jogadores carregados com sucesso", {
        total: resultado.total,
        quantidade: resultado.jogadores.length,
      });
    } catch (error) {
      const mensagemErro = getMensagemErro(error, "Erro ao carregar jogadores");
      setErrorMessage(mensagemErro);
      logger.error("Erro ao carregar jogadores", {}, paraError(error));
    } finally {
      setLoading(false);
    }
  }, [busca, nivelFiltro, statusFiltro, generoFiltro, offset, limite]);

  /**
   * Carregar ao montar e quando filtros mudarem
   */
  useEffect(() => {
    carregarJogadores();
  }, [carregarJogadores]);

  /**
   * Limpar filtros
   */
  const limparFiltros = useCallback(() => {
    logger.info("Limpando filtros");
    setBusca("");
    setNivelFiltro("");
    setStatusFiltro("");
    setGeneroFiltro("");
    setOffset(0);
  }, []);

  /**
   * Handlers de paginação
   */
  const handlePaginaAnterior = useCallback(() => {
    if (offset > 0) {
      logger.info("Navegando para página anterior");
      setOffset(offset - limite);
    }
  }, [offset, limite]);

  const handleProximaPagina = useCallback(() => {
    if (temMais) {
      logger.info("Navegando para próxima página");
      setOffset(offset + limite);
    }
  }, [offset, limite, temMais]);

  const irParaPagina = useCallback(
    (pagina: number) => setOffset((pagina - 1) * limite),
    [limite]
  );

  /**
   * Handler de deletar jogador
   * Retorna true se sucesso, false se erro
   */
  const handleDeletarJogador = useCallback(
    async (jogador: Jogador): Promise<boolean> => {
      try {
        logger.info("Deletando jogador", { jogadorId: jogador.id });

        const jogadorService = getJogadorService();
        await jogadorService.deletar(jogador.id);

        setSuccessMessage(`${jogador.nome} foi deletado com sucesso`);
        logger.info("Jogador deletado com sucesso", { jogadorId: jogador.id });

        // Recarregar lista
        carregarJogadores();
        return true;
      } catch (error) {
        const mensagemErro = getMensagemErro(error, "Erro ao deletar jogador");
        setErrorMessage(mensagemErro);
        logger.error(
          "Erro ao deletar jogador",
          { jogadorId: jogador.id },
          paraError(error)
        );
        return false;
      }
    },
    [carregarJogadores]
  );

  /**
   * Resetar offset quando busca mudar
   */
  const handleSetBusca = useCallback((value: string) => {
    setBusca(value);
    setOffset(0);
  }, []);

  const handleSetNivelFiltro = useCallback((value: NivelJogador | "") => {
    setNivelFiltro(value);
    setOffset(0);
  }, []);

  const handleSetStatusFiltro = useCallback((value: StatusJogador | "") => {
    setStatusFiltro(value);
    setOffset(0);
  }, []);

  const handleSetGeneroFiltro = useCallback((value: GeneroJogador | "") => {
    setGeneroFiltro(value);
    setOffset(0);
  }, []);

  /**
   * Exportar jogadores para Excel
   */
  const handleExportarExcel = useCallback(async () => {
    try {
      setExportando(true);
      setErrorMessage("");
      const jogadorService = getJogadorService();
      await jogadorService.exportarExcel();
      setSuccessMessage("Jogadores exportados com sucesso");
    } catch (error) {
      setErrorMessage(getMensagemErro(error, "Erro ao exportar jogadores"));
    } finally {
      setExportando(false);
    }
  }, []);

  /**
   * Importar jogadores de Excel
   */
  const handleImportarExcel = useCallback(
    async (file: File): Promise<{ criados: number; ignorados: string[] }> => {
      const jogadorService = getJogadorService();
      const resultado = await jogadorService.importarExcel(file);
      carregarJogadores();
      return { criados: resultado.criados, ignorados: resultado.ignorados };
    },
    [carregarJogadores]
  );

  return {
    // Estados principais
    jogadores,
    loading,
    arena,

    // Mensagens
    errorMessage,
    successMessage,
    setErrorMessage,
    setSuccessMessage,

    // Filtros
    busca,
    setBusca: handleSetBusca,
    nivelFiltro,
    setNivelFiltro: handleSetNivelFiltro,
    statusFiltro,
    setStatusFiltro: handleSetStatusFiltro,
    generoFiltro,
    setGeneroFiltro: handleSetGeneroFiltro,
    limparFiltros,
    temFiltrosAtivos,

    // Paginação
    total,
    offset,
    limite,
    temMais,
    paginaAtual,
    totalPaginas,
    handlePaginaAnterior,
    handleProximaPagina,
    irParaPagina,

    // Ações
    carregarJogadores,
    handleDeletarJogador,

    // Import/Export
    exportando,
    handleExportarExcel,
    handleImportarExcel,
  };
};

export default useListagemJogadores;
