/**
 * Dados e ações da tela de chaves do Teams
 */

import { useEffect, useMemo, useState } from "react";
import { getEtapaService, getTeamsService } from "@/services";
import { invalidateRankingCache } from "@/components/jogadores/RankingList";
import { FaseEtapa } from "@/types/chave";
import {
  ConfrontoEquipe,
  Equipe,
  PartidaTeams,
  StatusConfronto,
  TipoJogoTeams,
} from "@/types/teams";
import { contarFinalizados, ordenarConfrontos } from "@/utils/teams";
import { ordenarEquipes } from "@/utils/classificacao";
import { getMensagemErro } from "@/utils/erro";

export interface GrupoTeams {
  id: string;
  nome: string;
  equipes: Equipe[];
  confrontos: ConfrontoEquipe[];
}

interface ModalResultados {
  confronto: ConfrontoEquipe;
  partidas: PartidaTeams[];
}

interface ModalJogadores {
  partida: PartidaTeams;
  equipe1: Equipe;
  equipe2: Equipe;
  partidasConfronto: PartidaTeams[];
}

interface UseChavesTeamsParams {
  etapaId: string;
  onAtualizar?: () => void;
}

/**
 * O confronto guarda uma cópia do nome da equipe; o que vale é o da equipe
 * (a cópia pode estar antiga em confrontos gravados antes de renomear)
 */
const comNomesAtuais = (
  confrontos: ConfrontoEquipe[],
  equipes: Equipe[]
): ConfrontoEquipe[] => {
  const nomes = new Map(equipes.map((e) => [e.id, e.nome]));

  return confrontos.map((c) => ({
    ...c,
    equipe1Nome: nomes.get(c.equipe1Id) ?? c.equipe1Nome,
    equipe2Nome: nomes.get(c.equipe2Id) ?? c.equipe2Nome,
  }));
};

const montarGrupos = (
  equipes: Equipe[],
  confrontosGrupos: ConfrontoEquipe[]
): GrupoTeams[] => {
  // Com menos de 6 equipes não há grupos: todas jogam entre si
  if (!equipes.some((e) => e.grupoId)) {
    return [
      {
        id: "todas",
        nome: "Todas as Equipes",
        equipes,
        confrontos: ordenarConfrontos(confrontosGrupos),
      },
    ];
  }

  const grupoDe = (item: { grupoId?: string }) => item.grupoId || "A";
  const ids = Array.from(new Set(equipes.map(grupoDe))).sort();

  return ids.map((id) => ({
    id,
    nome: `Grupo ${id}`,
    equipes: equipes.filter((e) => grupoDe(e) === id),
    confrontos: ordenarConfrontos(
      confrontosGrupos.filter((c) => grupoDe(c) === id)
    ),
  }));
};

export const useChavesTeams = ({
  etapaId,
  onAtualizar,
}: UseChavesTeamsParams) => {
  const teamsService = getTeamsService();
  const etapaService = getEtapaService();

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [confrontosSalvos, setConfrontos] = useState<ConfrontoEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mensagem da operação em andamento; null = nenhuma
  const [operacao, setOperacao] = useState<string | null>(null);

  const [confrontoExpandido, setConfrontoExpandido] = useState<string | null>(
    null
  );
  const [partidasPorConfronto, setPartidasPorConfronto] = useState<
    Map<string, PartidaTeams[]>
  >(new Map());
  const [modalResultados, setModalResultados] =
    useState<ModalResultados | null>(null);
  const [modalJogadores, setModalJogadores] = useState<ModalJogadores | null>(
    null
  );

  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError(null);

      const [equipesData, confrontosData] = await Promise.all([
        teamsService.buscarEquipes(etapaId),
        teamsService.buscarConfrontos(etapaId),
      ]);
      setEquipes(ordenarEquipes(equipesData));
      setConfrontos(confrontosData);
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao carregar dados"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaId]);

  /** Bloqueia a tela enquanto executa e avisa se der erro */
  const executar = async (
    mensagem: string,
    erroPadrao: string,
    acao: () => Promise<void>
  ) => {
    try {
      setOperacao(mensagem);
      await acao();
    } catch (err) {
      alert(getMensagemErro(err, erroPadrao));
    } finally {
      setOperacao(null);
    }
  };

  // ============== PARTIDAS DO CONFRONTO ==============

  const guardarPartidas = (confrontoId: string, partidas: PartidaTeams[]) =>
    setPartidasPorConfronto((prev) => new Map(prev).set(confrontoId, partidas));

  const esquecerPartidas = (confrontoId: string) =>
    setPartidasPorConfronto((prev) => {
      const novo = new Map(prev);
      novo.delete(confrontoId);
      return novo;
    });

  const buscarPartidas = async (
    confrontoId: string
  ): Promise<PartidaTeams[]> => {
    const partidas = await teamsService.buscarPartidasConfronto(
      etapaId,
      confrontoId
    );
    guardarPartidas(confrontoId, partidas);
    return partidas;
  };

  /** As partidas só são criadas no primeiro acesso ao confronto */
  const garantirPartidas = async (
    confronto: ConfrontoEquipe
  ): Promise<PartidaTeams[]> => {
    if (confronto.partidas?.length) {
      const guardadas = partidasPorConfronto.get(confronto.id);
      if (guardadas) return guardadas;
      setOperacao("Carregando partidas...");
      return buscarPartidas(confronto.id);
    }

    setOperacao("Gerando partidas...");
    await teamsService.gerarPartidasConfronto(etapaId, confronto.id);
    await carregarDados(true);
    return buscarPartidas(confronto.id);
  };

  const alternarConfronto = async (confronto: ConfrontoEquipe) => {
    if (confrontoExpandido === confronto.id) {
      setConfrontoExpandido(null);
      return;
    }

    // Já carregado: abre sem piscar o carregamento
    if (partidasPorConfronto.get(confronto.id)?.length) {
      setConfrontoExpandido(confronto.id);
      return;
    }

    await executar(
      "Carregando partidas...",
      "Erro ao carregar partidas",
      async () => {
        await garantirPartidas(confronto);
        setConfrontoExpandido(confronto.id);
      }
    );
  };

  // ============== RESULTADOS ==============

  const abrirResultados = (confronto: ConfrontoEquipe) =>
    executar(
      "Carregando partidas...",
      "Erro ao carregar partidas",
      async () => {
        const partidas = await garantirPartidas(confronto);
        setModalResultados({ confronto, partidas });
      }
    );

  /** Jogadores podem ter mudado dentro do modal: as partidas são relidas */
  const fecharResultados = () => {
    if (modalResultados) esquecerPartidas(modalResultados.confronto.id);
    setModalResultados(null);
    setConfrontoExpandido(null);
  };

  const concluirResultados = async () => {
    fecharResultados();
    await carregarDados(true);
  };

  // ============== JOGADORES E DECIDER ==============

  const abrirJogadores = (
    partida: PartidaTeams,
    confronto: ConfrontoEquipe,
    partidasConfronto: PartidaTeams[]
  ) => {
    const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
    const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);
    if (equipe1 && equipe2) {
      setModalJogadores({ partida, equipe1, equipe2, partidasConfronto });
    }
  };

  /** Erro ao salvar sobe para o modal, que mostra a mensagem */
  const confirmarJogadores = async (
    dupla1Ids: [string, string],
    dupla2Ids: [string, string]
  ) => {
    if (!modalJogadores) return;
    const { partida } = modalJogadores;

    await teamsService.definirJogadoresPartida(
      etapaId,
      partida.id,
      dupla1Ids,
      dupla2Ids
    );

    try {
      await buscarPartidas(partida.confrontoId);
    } catch (err) {
      console.error("Erro ao recarregar partidas:", err);
      esquecerPartidas(partida.confrontoId);
    }
    setModalJogadores(null);
    await carregarDados(true);
  };

  const gerarDecider = (confronto: ConfrontoEquipe) =>
    executar("Gerando decider...", "Erro ao gerar decider", async () => {
      // As partidas guardadas não têm o decider
      esquecerPartidas(confronto.id);
      await teamsService.gerarDecider(etapaId, confronto.id);
      await carregarDados(true);

      const partidas = await buscarPartidas(confronto.id);
      // Se o admin fechar o modal, o decider já fica à vista para definir depois
      setConfrontoExpandido(confronto.id);

      // No sorteio o decider já vem com as duplas; na formação manual, escolhe agora
      const decider = partidas.find(
        (p) => p.tipoJogo === TipoJogoTeams.DECIDER
      );
      if (decider && !decider.dupla1?.length) {
        abrirJogadores(decider, confronto, partidas);
      }
    });

  // ============== EQUIPES E ETAPA ==============

  /** Devolve true quando salvou */
  const renomearEquipe = async (
    equipeId: string,
    nome: string
  ): Promise<boolean> => {
    try {
      await teamsService.renomearEquipe(etapaId, equipeId, nome);
      setEquipes((prev) =>
        prev.map((e) => (e.id === equipeId ? { ...e, nome } : e))
      );
      return true;
    } catch (err) {
      alert(getMensagemErro(err, "Erro ao renomear equipe"));
      return false;
    }
  };

  const gerarEliminatoria = () =>
    executar(
      "Gerando fase eliminatória...",
      "Erro ao gerar fase eliminatória",
      async () => {
        await teamsService.gerarFaseEliminatoria(etapaId);
        await carregarDados(true);
      }
    );

  const cancelarEliminatoria = (aoConcluir: () => void) =>
    executar(
      "Cancelando fase eliminatória...",
      "Erro ao cancelar fase eliminatória",
      async () => {
        await teamsService.cancelarFaseEliminatoria(etapaId);
        aoConcluir();
        setPartidasPorConfronto(new Map());
        await carregarDados(true);
      }
    );

  const encerrarEtapa = (aoConcluir: () => void) =>
    executar("Encerrando etapa...", "Erro ao encerrar etapa", async () => {
      await etapaService.encerrarEtapa(etapaId);
      invalidateRankingCache();
      aoConcluir();
      onAtualizar?.();
    });

  // ============== DADOS DERIVADOS ==============

  const derivados = useMemo(() => {
    const confrontos = comNomesAtuais(confrontosSalvos, equipes);
    const confrontosGrupos = confrontos.filter(
      (c) => c.fase === FaseEtapa.GRUPOS
    );
    const confrontosEliminatoria = confrontos.filter(
      (c) => c.fase !== FaseEtapa.GRUPOS
    );
    const finalizados = contarFinalizados(confrontos);

    return {
      confrontos,
      confrontosGrupos,
      confrontosEliminatoria,
      finalizados,
      grupos: montarGrupos(equipes, confrontosGrupos),
      temFaseGrupos: equipes.some((e) => e.grupoId),
      todosFinalizados:
        confrontos.length > 0 && finalizados === confrontos.length,
      gruposConcluidos:
        confrontosGrupos.length > 0 &&
        confrontosGrupos.every((c) => c.status === StatusConfronto.FINALIZADO),
      // Os confrontos do mata-mata existem desde a geração das chaves, com as
      // vagas ("1º Grupo A") vazias até o admin gerar a fase eliminatória
      eliminatoriaGerada: confrontosEliminatoria.some((c) => !!c.equipe1Id),
    };
  }, [equipes, confrontosSalvos]);

  return {
    ...derivados,
    equipes,
    loading,
    error,
    operacao,
    carregarDados,
    confrontoExpandido,
    partidasPorConfronto,
    alternarConfronto,
    modalResultados,
    abrirResultados,
    fecharResultados,
    concluirResultados,
    modalJogadores,
    abrirJogadores,
    fecharJogadores: () => setModalJogadores(null),
    confirmarJogadores,
    gerarDecider,
    renomearEquipe,
    gerarEliminatoria,
    cancelarEliminatoria,
    encerrarEtapa,
  };
};

export type ChavesTeamsState = ReturnType<typeof useChavesTeams>;
