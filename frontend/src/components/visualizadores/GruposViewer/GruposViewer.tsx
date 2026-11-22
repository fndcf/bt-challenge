import React, { useState } from "react";
import styled from "styled-components";
import { Badge, BadgeTom, EmptyState } from "@/components/ui";
import {
  CardConfronto,
  GrupoPainel,
  GruposGrid,
  ListaConfrontos,
  TabelaClassificacao,
} from "@/components/torneio";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import {
  COLUNAS_PUBLICO,
  COLUNAS_PUBLICO_TEAMS,
  LinhaClassificacao,
} from "@/utils/classificacao";
import { equipeVenceu, getSituacaoConfronto } from "@/utils/teams";

// ============== TYPES ==============

interface Dupla {
  id: string;
  jogador1Nome: string;
  jogador2Nome: string;
  posicaoGrupo: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  saldoGames: number;
  jogos: number;
  classificada: boolean;
}

interface JogadorIndividual {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  posicaoGrupo?: number;
  jogosGrupo: number;
  vitoriasGrupo: number;
  derrotasGrupo: number;
  pontosGrupo: number;
  saldoGamesGrupo: number;
  gamesVencidosGrupo: number;
  gamesPerdidosGrupo: number;
  classificado: boolean;
}

interface Partida {
  id: string;
  dupla1Id?: string;
  dupla2Id?: string;
  dupla1Nome: string;
  dupla2Nome: string;
  status: string;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
  }>;
  vencedoraId?: string;
  vencedoraNome?: string;
  vencedores?: string[];
  vencedoresNomes?: string;
}

// Jogador dentro de uma equipe TEAMS
interface JogadorEquipe {
  id: string;
  nome: string;
  nivel?: string;
  genero?: string;
}

// Equipe para formato TEAMS
interface Equipe {
  id: string;
  nome: string;
  posicaoGrupo?: number;
  pontos: number;
  vitorias: number;
  derrotas: number;
  jogosVencidos: number;
  jogosPerdidos: number;
  saldoJogos: number;
  classificada: boolean;
  jogadores?: JogadorEquipe[];
}

// Dupla dentro de uma partida TEAMS
interface DuplaPartidaTeams {
  jogador1Id: string;
  jogador1Nome: string;
  jogador2Id: string;
  jogador2Nome: string;
  equipeId: string;
  equipeNome: string;
}

// Partida dentro de um confronto TEAMS
interface PartidaTeams {
  id: string;
  ordem: number;
  tipoJogo: "feminino" | "masculino" | "misto" | "decider";
  status: string;
  dupla1: DuplaPartidaTeams;
  dupla2: DuplaPartidaTeams;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{ numero: number; gamesDupla1: number; gamesDupla2: number }>;
  vencedoraEquipeId?: string;
  vencedoraEquipeNome?: string;
}

// Confronto para formato TEAMS
interface Confronto {
  id: string;
  fase?: string;
  rodada?: number;
  grupoId?: string;
  grupoNome?: string;
  equipe1Id?: string;
  equipe2Id?: string;
  equipe1Nome?: string;
  equipe2Nome?: string;
  equipe1Origem?: string;
  equipe2Origem?: string;
  status: string;
  jogosEquipe1: number;
  jogosEquipe2: number;
  vencedoraId?: string;
  partidas?: PartidaTeams[];
}

interface Grupo {
  id: string;
  nome: string;
  ordem: number;
  totalDuplas?: number;
  totalJogadores?: number;
  totalEquipes?: number;
  completo: boolean;
  duplas?: Dupla[];
  jogadores?: JogadorIndividual[];
  equipes?: Equipe[];
  partidas: Partida[];
  confrontos?: Confronto[];
  formato?: "dupla_fixa" | "rei_da_praia" | "super_x" | "teams";
  tipo?: "grupos" | "eliminatoria"; // Para TEAMS: diferenciar fase de grupos de eliminatórias
}

interface GruposViewerProps {
  grupos: Grupo[];
}

// ============== STYLED COMPONENTS ==============

const { texto, superficie } = theme.semantic;

const Wrapper = styled.section`
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 24px;

  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;

  @media (min-width: 768px) {
    margin-bottom: 32px;
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }

  @media (min-width: 768px) {
    font-size: 14px;
    padding: 10px 18px;
  }
`;

const CollapsedSummary = styled.div<{ $visible: boolean }>`
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  display: ${(props) => (props.$visible ? "flex" : "none")};
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    padding: 24px;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const SummaryLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`;

const SummaryValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const GroupContent = styled.div`
  padding: 16px;

  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const SectionTitle = styled.h4`
  font-size: 12px;
  font-weight: 700;
  color: ${texto.secundario};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;

  @media (min-width: 768px) {
    font-size: 13px;
    margin-bottom: 16px;
  }
`;

// Standings Table
// Matches
// Partidas dentro do confronto TEAMS
const PartidasTeams = styled(ListaConfrontos)`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${superficie.borda};
`;

// Seção de Equipes com Jogadores
const EquipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const EquipeCard = styled.div`
  background: ${superficie.fundoAlternativo};
  border: 1px solid ${superficie.borda};
  border-radius: 8px;
  padding: 12px;
`;

const EquipeNome = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: ${texto.principal};
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${superficie.borda};
`;

const JogadoresList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const JogadorItem = styled.li`
  padding: 4px 0;
  font-size: 12px;
  color: ${texto.secundario};
`;

// ============== HELPERS ==============

/** Situação da partida */
const getSituacao = (
  status: string | undefined
): { label: string; tom: BadgeTom } => {
  if (estaFinalizada(status)) return { label: "Finalizada", tom: "sucesso" };
  return status?.toUpperCase() === "EM_ANDAMENTO"
    ? { label: "Ao vivo", tom: "info" }
    : { label: "Agendada", tom: "aviso" };
};

const estaFinalizada = (status?: string): boolean =>
  ["FINALIZADO", "FINALIZADA"].includes(status?.toUpperCase() ?? "");

const TIPO_JOGO_LABEL: Record<string, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  misto: "Misto",
  decider: "Decider",
};

/** Games de um lado, set a set ("6, 3"); vazio enquanto não terminou */
const formatarPlacar = (
  partida: Pick<Partida, "placar" | "status">,
  lado: "gamesDupla1" | "gamesDupla2"
): string | undefined =>
  estaFinalizada(partida.status) && partida.placar?.length
    ? partida.placar.map((set) => set[lado]).join(", ")
    : undefined;

/** A dupla vem como objeto (nomes) ou como lista de jogadores */
const getDuplaNomes = (
  dupla?: DuplaPartidaTeams | JogadorEquipe[] | null
): string => {
  if (!dupla) return "A definir";
  if (Array.isArray(dupla)) {
    return dupla.length >= 2
      ? `${dupla[0]?.nome} & ${dupla[1]?.nome}`
      : "A definir";
  }
  if (dupla.jogador1Nome && dupla.jogador2Nome) {
    return `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`;
  }
  return dupla.equipeNome || "A definir";
};

const getVencedorPartida = (partida: Partida): 1 | 2 | null => {
  if (!estaFinalizada(partida.status)) return null;

  // Sets são a fonte mais confiável; os nomes ficam de reserva
  const { setsDupla1, setsDupla2 } = partida;
  if (setsDupla1 !== undefined && setsDupla2 !== undefined) {
    if (setsDupla1 === setsDupla2) return null;
    return setsDupla1 > setsDupla2 ? 1 : 2;
  }

  const vencedor = partida.vencedoresNomes || partida.vencedoraNome;
  if (!vencedor) return null;
  if (vencedor === partida.dupla1Nome) return 1;
  return vencedor === partida.dupla2Nome ? 2 : null;
};

const montarTabela = (
  grupo: Grupo,
  formato: FormatoEtapa
): { rotulo: string; linhas: LinhaClassificacao[] } | null => {
  if (formato === FormatoEtapa.TEAMS) {
    const equipes = grupo.equipes ?? [];
    // Antes do primeiro resultado mostra só as equipes
    const temResultado = equipes.some((e) => e.pontos > 0 || e.vitorias > 0);
    if (!temResultado) return null;

    return {
      rotulo: "Equipe",
      linhas: equipes.map((e, index) => ({
        id: e.id,
        posicao: e.posicaoGrupo || index + 1,
        nome: e.nome,
        classificado: e.classificada,
        estatisticas: e,
      })),
    };
  }

  if (
    formato === FormatoEtapa.REI_DA_PRAIA ||
    formato === FormatoEtapa.SUPER_X
  ) {
    if (!grupo.jogadores?.length) return null;

    return {
      rotulo: "Jogador",
      linhas: grupo.jogadores.map((j, index) => ({
        id: j.id,
        posicao: j.posicaoGrupo || index + 1,
        nome: j.jogadorNome,
        classificado: j.classificado,
        estatisticas: {
          jogos: j.jogosGrupo,
          vitorias: j.vitoriasGrupo,
          derrotas: j.derrotasGrupo,
          pontos: j.pontosGrupo,
          saldoGames: j.saldoGamesGrupo,
        },
      })),
    };
  }

  if (!grupo.duplas?.length) return null;

  return {
    rotulo: "Dupla",
    linhas: grupo.duplas.map((d, index) => ({
      id: d.id,
      posicao: d.posicaoGrupo || index + 1,
      nome: `${d.jogador1Nome} & ${d.jogador2Nome}`,
      classificado: d.classificada,
      estatisticas: d,
    })),
  };
};

const renderPartida = (partida: Partida) => {
  const vencedor = getVencedorPartida(partida);

  return (
    <CardConfronto
      key={partida.id}
      situacao={getSituacao(partida.status)}
      lado1={{
        nome: partida.dupla1Nome,
        placar: formatarPlacar(partida, "gamesDupla1"),
        vencedor: vencedor === 1,
      }}
      lado2={{
        nome: partida.dupla2Nome,
        placar: formatarPlacar(partida, "gamesDupla2"),
        vencedor: vencedor === 2,
      }}
    />
  );
};

const renderPartidaTeams = (partida: PartidaTeams) => {
  const venceu = (equipeId?: string) =>
    !!partida.vencedoraEquipeId && partida.vencedoraEquipeId === equipeId;

  return (
    <CardConfronto
      key={partida.id}
      compacto
      etiquetas={
        <Badge>{TIPO_JOGO_LABEL[partida.tipoJogo] ?? partida.tipoJogo}</Badge>
      }
      situacao={getSituacao(partida.status)}
      lado1={{
        nome: getDuplaNomes(partida.dupla1),
        placar: formatarPlacar(partida, "gamesDupla1"),
        vencedor: venceu(partida.dupla1?.equipeId),
      }}
      lado2={{
        nome: getDuplaNomes(partida.dupla2),
        placar: formatarPlacar(partida, "gamesDupla2"),
        vencedor: venceu(partida.dupla2?.equipeId),
      }}
    />
  );
};

const renderConfronto = (confronto: Confronto) => {
  return (
    <CardConfronto
      key={confronto.id}
      situacao={getSituacaoConfronto(confronto, "Agendado")}
      lado1={{
        nome: confronto.equipe1Nome || "A definir",
        placar: confronto.jogosEquipe1 || 0,
        vencedor: equipeVenceu(confronto, confronto.equipe1Id),
      }}
      lado2={{
        nome: confronto.equipe2Nome || "A definir",
        placar: confronto.jogosEquipe2 || 0,
        vencedor: equipeVenceu(confronto, confronto.equipe2Id),
      }}
    >
      {!!confronto.partidas?.length && (
        <PartidasTeams>
          {confronto.partidas.map(renderPartidaTeams)}
        </PartidasTeams>
      )}
    </CardConfronto>
  );
};

// ============== COMPONENT ==============

const GruposViewer: React.FC<GruposViewerProps> = ({ grupos }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!grupos?.length) {
    return (
      <Wrapper>
        <Header>
          <Title>Fase de Grupos</Title>
        </Header>
        <EmptyState titulo="Grupos ainda não formados" />
      </Wrapper>
    );
  }

  const formato = (grupos[0]?.formato ||
    (grupos[0]?.equipes?.length
      ? FormatoEtapa.TEAMS
      : grupos[0]?.jogadores?.length
      ? FormatoEtapa.REI_DA_PRAIA
      : FormatoEtapa.DUPLA_FIXA)) as FormatoEtapa;
  const isTeams = formato === FormatoEtapa.TEAMS;

  // Ordenar grupos: fase de grupos primeiro, depois eliminatórias (semifinal, final)
  // O backend já envia ordem correta (1, 2, 3 para grupos e 100+ para eliminatórias)
  // Mas vamos garantir a ordenação correta pelo tipo também
  const gruposOrdenados = [...grupos].sort((a, b) => {
    // Prioridade por tipo: grupos primeiro, eliminatória depois
    // O backend define tipo: "grupos" ou tipo: "eliminatoria"
    const tipoA = a.tipo === "eliminatoria" ? 1000 : 0;
    const tipoB = b.tipo === "eliminatoria" ? 1000 : 0;

    if (tipoA !== tipoB) return tipoA - tipoB;

    // Dentro do mesmo tipo, ordenar por ordem (se existir)
    const ordemA = a.ordem ?? 0;
    const ordemB = b.ordem ?? 0;
    return ordemA - ordemB;
  });

  // Calcular estatísticas resumidas
  const totalGrupos = grupos.length;
  // Para TEAMS, contar confrontos ao invés de partidas
  const totalPartidas = isTeams
    ? grupos.reduce((acc, g) => acc + (g.confrontos?.length || 0), 0)
    : grupos.reduce((acc, g) => acc + (g.partidas?.length || 0), 0);
  const partidasFinalizadas = isTeams
    ? grupos.reduce(
        (acc, g) =>
          acc +
          (g.confrontos?.filter((c) => c.status?.toUpperCase() === "FINALIZADO")
            .length || 0),
        0
      )
    : grupos.reduce(
        (acc, g) =>
          acc +
          (g.partidas?.filter((p) => p.status?.toUpperCase() === "FINALIZADA")
            .length || 0),
        0
      );

  return (
    <Wrapper>
      <Header>
        <Title>
          {isTeams ? "Confrontos" : "Fase de Grupos"}
          <Badge formato={formato}>
            {getCoresFormato(formato).nome}
          </Badge>
        </Title>
        <ToggleButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "▲ Recolher" : "▼ Expandir"}
        </ToggleButton>
      </Header>

      <CollapsedSummary $visible={!isExpanded}>
          {!isTeams && (
            <SummaryItem>
              <SummaryLabel>Grupos</SummaryLabel>
              <SummaryValue>{totalGrupos}</SummaryValue>
            </SummaryItem>
          )}
          <SummaryItem>
            <SummaryLabel>{isTeams ? "Confrontos" : "Partidas"}</SummaryLabel>
            <SummaryValue>{totalPartidas}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Finalizados</SummaryLabel>
            <SummaryValue>{partidasFinalizadas}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Progresso</SummaryLabel>
            <SummaryValue>
              {totalPartidas > 0
                ? Math.round((partidasFinalizadas / totalPartidas) * 100)
                : 0}
              %
            </SummaryValue>
          </SummaryItem>
        </CollapsedSummary>

      {isExpanded && (
        <GruposGrid>
          {gruposOrdenados.map((group) => {
            const tabela = montarTabela(group, formato);

            return (
              <GrupoPainel key={group.id} formato={formato} nome={group.nome}>
                {tabela && (
                  <TabelaClassificacao
                    formato={formato}
                    legenda={`Classificação: ${group.nome}`}
                    rotuloNome={tabela.rotulo}
                    colunas={isTeams ? COLUNAS_PUBLICO_TEAMS : COLUNAS_PUBLICO}
                    linhas={tabela.linhas}
                  />
                )}

                <GroupContent>
                  {isTeams && !!group.equipes?.length && (
                    <>
                      <SectionTitle>Equipes</SectionTitle>
                      <EquipesGrid>
                        {group.equipes.map((equipe) => (
                          <EquipeCard key={equipe.id}>
                            <EquipeNome>{equipe.nome}</EquipeNome>
                            {!!equipe.jogadores?.length && (
                              <JogadoresList>
                                {equipe.jogadores.map((jogador) => (
                                  <JogadorItem key={jogador.id}>
                                    {jogador.nome}
                                  </JogadorItem>
                                ))}
                              </JogadoresList>
                            )}
                          </EquipeCard>
                        ))}
                      </EquipesGrid>
                    </>
                  )}

                  {isTeams && !!group.confrontos?.length && (
                    <>
                      {/* Na eliminatória o nome da fase já está no cabeçalho */}
                      {group.tipo !== "eliminatoria" && (
                        <SectionTitle>Confrontos</SectionTitle>
                      )}
                      <ListaConfrontos>
                        {group.confrontos.map(renderConfronto)}
                      </ListaConfrontos>
                    </>
                  )}

                  {!isTeams && group.partidas?.length > 0 && (
                    <>
                      <SectionTitle>Partidas</SectionTitle>
                      <ListaConfrontos>
                        {group.partidas.map(renderPartida)}
                      </ListaConfrontos>
                    </>
                  )}
                </GroupContent>
              </GrupoPainel>
            );
          })}
        </GruposGrid>
      )}
    </Wrapper>
  );
};

export default GruposViewer;
