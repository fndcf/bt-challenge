/**
 * Dados e ações do modal de inscrição: carregar, cadastrar, selecionar e
 * inscrever jogadores
 */

import { useEffect, useMemo, useState } from "react";
import {
  CriarJogadorDTO,
  GeneroJogador,
  Jogador,
  NivelJogador,
  StatusJogador,
} from "@/types/jogador";
import { FormatoEtapa } from "@/types/etapa";
import {
  passaNoFiltroGenero,
  ValorFiltroGenero,
} from "@/components/jogadores/Genero";
import { getEtapaService, getJogadorService } from "@/services";

export interface UseModalInscricaoParams {
  etapaId: string;
  etapaNivel?: NivelJogador;
  etapaGenero: GeneroJogador;
  etapaFormato?: FormatoEtapa;
  maxJogadores: number;
  totalInscritos: number;
  onClose: () => void;
  onSuccess: () => void;
}

export type NovoJogador = Required<
  Pick<
    CriarJogadorDTO,
    "nome" | "email" | "telefone" | "nivel" | "status" | "genero"
  >
>;

export type AbaInscricao = "selecionar" | "cadastrar";

interface InscricaoAtual {
  jogadorId: string;
  jogadorGenero?: GeneroJogador;
}

export const useModalInscricao = ({
  etapaId,
  etapaNivel,
  etapaGenero,
  etapaFormato,
  maxJogadores,
  totalInscritos,
  onClose,
  onSuccess,
}: UseModalInscricaoParams) => {
  const jogadorService = getJogadorService();
  const etapaService = getEtapaService();

  // Gênero misto e nível livre: quem cadastra escolhe
  const isMisto = etapaGenero === GeneroJogador.MISTO;

  const novoJogadorVazio = (): NovoJogador => ({
    nome: "",
    email: "",
    telefone: "",
    nivel: etapaNivel || NivelJogador.INTERMEDIARIO,
    status: StatusJogador.ATIVO,
    genero: isMisto ? GeneroJogador.MASCULINO : etapaGenero,
  });

  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoAtual[]>([]);
  const [selecionados, setSelecionados] = useState<Jogador[]>([]);
  const [novoJogador, setNovoJogador] = useState<NovoJogador>(novoJogadorVazio);
  const [aba, setAba] = useState<AbaInscricao>("selecionar");
  const [busca, setBusca] = useState("");
  const [filtroGenero, setFiltroGenero] = useState<ValorFiltroGenero>("todos");
  const [loading, setLoading] = useState(false);
  const [loadingJogadores, setLoadingJogadores] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const vagasDisponiveis = maxJogadores - totalInscritos;

  const carregarJogadores = async () => {
    try {
      setLoadingJogadores(true);
      const data = await jogadorService.listar({
        nivel: etapaNivel,
        genero: isMisto ? undefined : etapaGenero,
      });
      setJogadores(data.jogadores || []);
    } catch {
      setError("Erro ao carregar jogadores");
      setJogadores([]);
    } finally {
      setLoadingJogadores(false);
    }
  };

  const carregarInscritos = async () => {
    try {
      const lista = await etapaService.listarInscricoes(etapaId);
      setInscricoes(
        lista.map((i) => ({
          jogadorId: i.jogadorId,
          jogadorGenero: i.jogadorGenero as GeneroJogador | undefined,
        }))
      );
    } catch {
      setInscricoes([]);
    }
  };

  useEffect(() => {
    carregarJogadores();
    carregarInscritos();
    // Só ao abrir: o modal é desmontado quando fecha
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Etapa mista de Teams ou Dupla Fixa exige 50% de cada gênero
  const exigeProporcao =
    isMisto &&
    (etapaFormato === FormatoEtapa.TEAMS ||
      etapaFormato === FormatoEtapa.DUPLA_FIXA);
  const maxPorGenero = maxJogadores / 2;

  const totalPorGenero = useMemo(() => {
    const contar = (genero: GeneroJogador) =>
      inscricoes.filter((i) => i.jogadorGenero === genero).length +
      selecionados.filter((j) => j.genero === genero).length;

    return {
      masculino: contar(GeneroJogador.MASCULINO),
      feminino: contar(GeneroJogador.FEMININO),
    };
  }, [inscricoes, selecionados]);

  const jogadoresDisponiveis = jogadores.filter(
    (jogador) =>
      jogador.status === StatusJogador.ATIVO &&
      !inscricoes.some((i) => i.jogadorId === jogador.id)
  );

  const termo = busca.toLowerCase();
  const jogadoresFiltrados = jogadoresDisponiveis.filter(
    (jogador) =>
      passaNoFiltroGenero(jogador.genero, filtroGenero) &&
      (jogador.nome.toLowerCase().includes(termo) ||
        jogador.email?.toLowerCase().includes(termo))
  );

  const estaSelecionado = (jogadorId: string): boolean =>
    selecionados.some((j) => j.id === jogadorId);

  /** Motivo para não poder selecionar, ou null se pode */
  const motivoBloqueio = (jogador: Jogador): string | null => {
    if (selecionados.length >= vagasDisponiveis) {
      return `Você só pode inscrever ${vagasDisponiveis} jogador(es) nesta etapa.`;
    }
    if (!exigeProporcao) return null;

    const complemento = "Etapas mistas requerem 50% de cada gênero.";
    if (
      jogador.genero === GeneroJogador.MASCULINO &&
      totalPorGenero.masculino >= maxPorGenero
    ) {
      return `Limite de jogadores masculinos atingido (${maxPorGenero}). ${complemento}`;
    }
    if (
      jogador.genero === GeneroJogador.FEMININO &&
      totalPorGenero.feminino >= maxPorGenero
    ) {
      return `Limite de jogadoras femininas atingido (${maxPorGenero}). ${complemento}`;
    }
    return null;
  };

  const toggleJogador = (jogador: Jogador) => {
    if (estaSelecionado(jogador.id)) {
      setSelecionados(selecionados.filter((j) => j.id !== jogador.id));
      return;
    }

    const motivo = motivoBloqueio(jogador);
    if (motivo) {
      alert(motivo);
      return;
    }
    setSelecionados([...selecionados, jogador]);
  };

  const cadastrarJogador = async () => {
    if (!novoJogador.nome.trim()) {
      setError("Por favor, preencha o nome do jogador");
      setSuccessMessage(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const criado = await jogadorService.criar(novoJogador);
      setJogadores([...jogadores, criado]);
      setNovoJogador(novoJogadorVazio());
      setAba("selecionar");

      setSuccessMessage(`✓ ${criado.nome} cadastrado com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar jogador");
    } finally {
      setLoading(false);
    }
  };

  const inscrever = async () => {
    if (selecionados.length === 0) {
      alert("Selecione pelo menos um jogador");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const inscritos = await etapaService.inscreverJogadores(
        etapaId,
        selecionados.map((j) => j.id)
      );

      const falhas = selecionados.length - inscritos.length;
      alert(
        falhas > 0
          ? `${inscritos.length} jogador(es) inscrito(s) com sucesso!\n${falhas} inscrição(ões) falharam. Verifique os critérios (nível, gênero, limite).`
          : `${selecionados.length} jogador(es) inscrito(s) com sucesso!`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao inscrever jogadores");
    } finally {
      setLoading(false);
    }
  };

  return {
    aba,
    setAba,
    busca,
    setBusca,
    filtroGenero,
    setFiltroGenero,
    loading,
    loadingJogadores,
    error,
    successMessage,
    isMisto,
    exigeProporcao,
    maxPorGenero,
    totalPorGenero,
    vagasDisponiveis,
    jogadores,
    jogadoresDisponiveis,
    jogadoresFiltrados,
    selecionados,
    estaSelecionado,
    toggleJogador,
    novoJogador,
    setNovoJogador,
    cadastrarJogador,
    inscrever,
  };
};
