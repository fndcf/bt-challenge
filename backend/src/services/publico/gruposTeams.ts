/**
 * Grupos e fases do Teams como aparecem na página pública da etapa
 */

import { FaseEtapa } from "../../models/Etapa";
import { ConfrontoEquipe, Equipe, PartidaTeams } from "../../models/Teams";

const ORDEM_FASES: Record<string, number> = {
  OITAVAS: 1,
  QUARTAS: 2,
  SEMIFINAL: 3,
  FINAL: 4,
  TERCEIRO_LUGAR: 5,
};

const NOME_FASES: Record<string, string> = {
  OITAVAS: "Oitavas de Final",
  QUARTAS: "Quartas de Final",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
  TERCEIRO_LUGAR: "Disputa 3º Lugar",
};

// Etapa sem fase de grupos: todas as equipes juntas
const GRUPO_UNICO = "unico";

const paraEquipePublica = (equipe: Equipe) => ({
  id: equipe.id,
  nome: equipe.nome,
  ordem: equipe.ordem || 0,
  grupoId: equipe.grupoId,
  grupoNome: equipe.grupoNome,
  posicaoGrupo: equipe.posicao || 0,
  pontos: equipe.pontos || 0,
  vitorias: equipe.vitorias || 0,
  derrotas: equipe.derrotas || 0,
  jogosVencidos: equipe.jogosVencidos || 0,
  jogosPerdidos: equipe.jogosPerdidos || 0,
  saldoJogos: equipe.saldoJogos || 0,
  classificada: equipe.classificada || false,
  jogadores: equipe.jogadores || [],
});

const paraPartidaPublica = (partida: PartidaTeams) => ({
  id: partida.id,
  ordem: partida.ordem || 0,
  tipoJogo: partida.tipoJogo,
  status: partida.status || "agendada",
  dupla1: partida.dupla1,
  dupla2: partida.dupla2,
  setsDupla1: partida.setsDupla1 || 0,
  setsDupla2: partida.setsDupla2 || 0,
  placar: partida.placar || [],
  vencedoraEquipeId: partida.vencedoraEquipeId,
  vencedoraEquipeNome: partida.vencedoraEquipeNome,
});

const paraConfrontoPublico = (
  confronto: ConfrontoEquipe,
  partidas: PartidaTeams[]
) => ({
  id: confronto.id,
  fase: confronto.fase || FaseEtapa.GRUPOS,
  grupoId: confronto.grupoId,
  ordem: confronto.ordem || 0,
  rodada: confronto.rodada,
  equipe1Id: confronto.equipe1Id,
  equipe2Id: confronto.equipe2Id,
  equipe1Nome: confronto.equipe1Nome,
  equipe2Nome: confronto.equipe2Nome,
  equipe1Origem: confronto.equipe1Origem,
  equipe2Origem: confronto.equipe2Origem,
  status: confronto.status || "agendado",
  jogosEquipe1: confronto.jogosEquipe1 || 0,
  jogosEquipe2: confronto.jogosEquipe2 || 0,
  vencedoraId: confronto.vencedoraId,
  vencedoraNome: confronto.vencedoraNome,
  partidas: partidas.map(paraPartidaPublica).sort(porOrdem),
  criadoEm: confronto.criadoEm,
});

type EquipePublica = ReturnType<typeof paraEquipePublica>;
type ConfrontoPublico = ReturnType<typeof paraConfrontoPublico>;

const porOrdem = (a: { ordem: number }, b: { ordem: number }) =>
  a.ordem - b.ordem;

const porClassificacao = (a: EquipePublica, b: EquipePublica) => {
  if (a.posicaoGrupo && b.posicaoGrupo) return a.posicaoGrupo - b.posicaoGrupo;
  if (a.pontos !== b.pontos) return b.pontos - a.pontos;
  return b.saldoJogos - a.saldoJogos;
};

const porRodada = (a: ConfrontoPublico, b: ConfrontoPublico) =>
  (a.rodada || 0) - (b.rodada || 0) || porOrdem(a, b);

const agrupar = <T>(itens: T[], chave: (item: T) => string) => {
  const mapa = new Map<string, T[]>();
  itens.forEach((item) => {
    const grupo = mapa.get(chave(item));
    if (grupo) grupo.push(item);
    else mapa.set(chave(item), [item]);
  });
  return mapa;
};

const nomeDoGrupo = (
  grupoId: string,
  equipes: EquipePublica[],
  numero: number
) => {
  if (grupoId === GRUPO_UNICO) return "Classificação";
  if (equipes[0]?.grupoNome) return equipes[0].grupoNome;
  // O id costuma ser a letra (A, B, C...)
  return `Grupo ${grupoId.length === 1 ? grupoId : numero}`;
};

/**
 * Um item por grupo, seguidos de um item por fase eliminatória
 */
export function montarGruposTeams(
  equipes: Equipe[],
  confrontos: ConfrontoEquipe[],
  partidas: PartidaTeams[]
) {
  const partidasPorConfronto = agrupar(partidas, (p) => p.confrontoId);
  const confrontosPublicos = confrontos
    .map((c) => paraConfrontoPublico(c, partidasPorConfronto.get(c.id) || []))
    .sort(porOrdem);

  const daFaseDeGrupos = (c: ConfrontoPublico) =>
    c.fase.toLowerCase() === FaseEtapa.GRUPOS;

  const equipesPorGrupo = agrupar(
    equipes.map(paraEquipePublica).sort(porOrdem),
    (e) => e.grupoId || GRUPO_UNICO
  );
  const confrontosPorGrupo = agrupar(
    confrontosPublicos.filter(daFaseDeGrupos),
    (c) => c.grupoId || GRUPO_UNICO
  );

  const grupoIds = [
    ...new Set([...equipesPorGrupo.keys(), ...confrontosPorGrupo.keys()]),
  ].sort((a, b) => {
    if (a === GRUPO_UNICO) return -1;
    if (b === GRUPO_UNICO) return 1;
    return a.localeCompare(b);
  });

  const grupos = grupoIds.map((grupoId, index) => {
    const equipesDoGrupo = (equipesPorGrupo.get(grupoId) || []).sort(
      porClassificacao
    );

    return {
      id: grupoId,
      nome: nomeDoGrupo(grupoId, equipesDoGrupo, index + 1),
      ordem: index + 1,
      totalEquipes: equipesDoGrupo.length,
      completo: false,
      equipes: equipesDoGrupo,
      confrontos: (confrontosPorGrupo.get(grupoId) || []).sort(porRodada),
      formato: "teams",
      tipo: "grupos",
    };
  });

  const confrontosPorFase = agrupar(
    confrontosPublicos.filter((c) => !daFaseDeGrupos(c)),
    // Gravada em minúsculas ("semifinal")
    (c) => c.fase.toUpperCase()
  );

  const fases = [...confrontosPorFase]
    .sort(([a], [b]) => (ORDEM_FASES[a] || 99) - (ORDEM_FASES[b] || 99))
    .map(([fase, confrontosDaFase], index) => ({
      id: `eliminatoria-${fase}`,
      nome: NOME_FASES[fase] || fase,
      // Depois dos grupos
      ordem: 100 + (ORDEM_FASES[fase] || index),
      totalEquipes: 0,
      completo: false,
      equipes: [] as EquipePublica[],
      confrontos: confrontosDaFase,
      formato: "teams",
      tipo: "eliminatoria",
    }));

  return [...grupos, ...fases].sort(porOrdem);
}
