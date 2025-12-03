/**
 * useListagemJogadores.ts
 *
 * Responsabilidade única: Gerenciar estado e lógica de negócio da listagem de jogadores
 */

import { useState, useEffect, useCallback } from "react";
import jogadorService from "@/services/jogadorService";
import { arenaAdminService } from "@/services/arenaAdminService";
import logger from "@/utils/logger";
import {
  Jogador,
  FiltrosJogador,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
} from "@/types/jogador";
import { Arena } from "@/types/arena";

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

  // Ações
  carregarJogadores: () => void;
  handleDeletarJogador: (jogador: Jogador) => Promise<void>;
}

export const useListagemJogadores = (): UseListagemJogadoresReturn => {
  // Estados principais
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [arena, setArena] = useState<Arena | null>(null);

  // Mensagens
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
   * Carregar arena ao montar
   */
  useEffect(() => {
    const carregarArena = async () => {
      try {
        logger.info("Carregando arena do usuário logado");
        const arenaData = await arenaAdminService.obterMinhaArena();
        setArena(arenaData);
        logger.info("Arena carregada com sucesso", { arena: arenaData.nome });
      } catch (error: any) {
        logger.warn("Erro ao carregar arena via API, tentando localStorage", {
          error: error.message,
        });

        // Fallback - pegar do localStorage se tiver
        const arenaLocalStorage = localStorage.getItem("arena");
        if (arenaLocalStorage) {
          try {
            const arenaParsed = JSON.parse(arenaLocalStorage);
            setArena(arenaParsed);
            logger.info("Arena carregada do localStorage", {
              arena: arenaParsed.nome,
            });
          } catch (e) {
            logger.error("Erro ao parsear arena do localStorage", {}, e);
          }
        }
      }
    };

    carregarArena();
  }, []);

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

      const resultado = await jogadorService.listar(filtros);

      setJogadores(resultado.jogadores);
      setTotal(resultado.total);
      setTemMais(resultado.temMais);

      logger.info("Jogadores carregados com sucesso", {
        total: resultado.total,
        quantidade: resultado.jogadores.length,
      });
    } catch (error: any) {
      const mensagemErro = error.message || "Erro ao carregar jogadores";
      setErrorMessage(mensagemErro);
      logger.error("Erro ao carregar jogadores", {}, error);
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

  /**
   * Handler de deletar jogador
   */
  const handleDeletarJogador = useCallback(
    async (jogador: Jogador) => {
      try {
        logger.info("Deletando jogador", { jogadorId: jogador.id });

        await jogadorService.deletar(jogador.id);

        setSuccessMessage(`${jogador.nome} foi deletado com sucesso`);
        logger.info("Jogador deletado com sucesso", { jogadorId: jogador.id });

        // Recarregar lista
        carregarJogadores();
      } catch (error: any) {
        const mensagemErro = error.message || "Erro ao deletar jogador";
        setErrorMessage(mensagemErro);
        logger.error("Erro ao deletar jogador", { jogadorId: jogador.id }, error);
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

    // Ações
    carregarJogadores,
    handleDeletarJogador,
  };
};

export default useListagemJogadores;
