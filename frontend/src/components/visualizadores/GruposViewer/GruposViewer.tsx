import React, { useState } from "react";
import styled from "styled-components";

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

const FormatoBadge = styled.span<{ $formato: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;

  ${(props) => {
    if (props.$formato === "rei_da_praia") {
      return `
        background: #ede9fe;
        color: #7c3aed;
      `;
    }
    if (props.$formato === "super_x") {
      return `
        background: #fef3c7;
        color: #d97706;
      `;
    }
    if (props.$formato === "teams") {
      return `
        background: #dcfce7;
        color: #166534;
      `;
    }
    return `
      background: #dbeafe;
      color: #2563eb;
    `;
  }}
`;

const GroupsGrid = styled.div<{ $visible: boolean }>`
  display: ${(props) => (props.$visible ? "grid" : "none")};
  gap: 24px;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
`;

const GroupCard = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
`;

const GroupHeader = styled.div<{ $formato?: string; $tipo?: string }>`
  background: ${(props) => {
    // Fases eliminatórias têm cor diferente (dourado/laranja)
    if (props.$tipo === "eliminatoria") {
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    }
    if (props.$formato === "rei_da_praia") {
      return "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)";
    }
    if (props.$formato === "super_x") {
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    }
    if (props.$formato === "teams") {
      return "linear-gradient(135deg, #059669 0%, #047857 100%)";
    }
    return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
  }};
  padding: 12px 16px;
  text-align: center;

  @media (min-width: 768px) {
    padding: 16px 20px;
  }
`;

const GroupName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 18px;
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
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;

  @media (min-width: 768px) {
    font-size: 13px;
    margin-bottom: 16px;
  }
`;

// Standings Table
const TableWrapper = styled.div`
  margin-bottom: 24px;

  @media (min-width: 768px) {
    margin-bottom: 28px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;

  @media (min-width: 768px) {
    font-size: 14px;
  }

  @media (min-width: 1024px) {
    font-size: 13px;
  }
`;

const THead = styled.thead`
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
`;

const Th = styled.th`
  padding: 10px 8px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;

  &:first-child {
    padding-left: 12px;
  }

  &:last-child {
    padding-right: 12px;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    padding: 12px 10px;
    font-size: 12px;
  }

  @media (min-width: 1024px) {
    padding: 10px 6px;
    font-size: 11px;

    &:first-child {
      padding-left: 10px;
    }

    &:last-child {
      padding-right: 10px;
    }
  }
`;

const TBody = styled.tbody``;

const Tr = styled.tr<{ $qualified?: boolean }>`
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;

  ${(props) =>
    props.$qualified &&
    `
    background: linear-gradient(90deg, #f0fdf4 0%, transparent 100%);
  `}

  &:hover {
    background: #fafafa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 12px 8px;
  color: #1f2937;

  &:first-child {
    padding-left: 12px;
  }

  &:last-child {
    padding-right: 12px;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    padding: 14px 10px;
  }

  @media (min-width: 1024px) {
    padding: 12px 6px;

    &:first-child {
      padding-left: 10px;
    }

    &:last-child {
      padding-right: 10px;
    }
  }
`;

const Position = styled.div<{ $qualified?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;

  ${(props) =>
    props.$qualified
      ? `
    background: #22c55e;
    color: white;
  `
      : `
    background: #f3f4f6;
    color: #6b7280;
  `}

  @media (min-width: 768px) and (max-width: 1023px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  @media (min-width: 1024px) {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #1f2937;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 768px) {
    max-width: 180px;
  }

  @media (min-width: 1024px) {
    max-width: 250px;
  }

  @media (min-width: 1200px) {
    max-width: 280px;
  }
`;

const StatBadge = styled.span<{ $type?: "positive" | "negative" | "neutral" }>`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;

  ${(props) => {
    switch (props.$type) {
      case "positive":
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case "negative":
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}

  @media (min-width: 768px) and (max-width: 1023px) {
    font-size: 13px;
    padding: 4px 10px;
  }

  @media (min-width: 1024px) {
    font-size: 11px;
    padding: 3px 7px;
  }
`;

// Matches
const MatchesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MatchCard = styled.div<{ $finished?: boolean }>`
  border: 2px solid ${(props) => (props.$finished ? "#e5e7eb" : "#fbbf24")};
  border-radius: 10px;
  overflow: hidden;
  background: white;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`;

const MatchHeader = styled.div`
  background: #fafafa;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 10px 16px;
  }
`;

const VS = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.1em;
  display: block;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 12px;
  }
`;

const Status = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${(props) => {
    const status = props.$status.toLowerCase();
    if (status === "finalizada")
      return `
      background: #dcfce7;
      color: #166534;
    `;
    if (status === "em_andamento")
      return `
      background: #dbeafe;
      color: #1e40af;
    `;
    return `
      background: #fef3c7;
      color: #92400e;
    `;
  }}

  @media (min-width: 768px) {
    font-size: 11px;
    padding: 5px 12px;
  }
`;

const MatchBody = styled.div`
  padding: 10px;

  @media (min-width: 768px) {
    padding: 12px;
  }
`;

const TeamRow = styled.div<{ $winner?: boolean; $finished?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;

  &:last-child {
    margin-bottom: 0;
  }

  ${(props) => {
    // Se é vencedor, destaque verde
    if (props.$winner) {
      return `
        background: linear-gradient(90deg, #f0fdf4 0%, transparent 100%);
        border-left: 3px solid #22c55e;
        font-weight: 600;
      `;
    }
    // Se partida finalizada mas não é vencedor, estilo perdedor
    if (props.$finished) {
      return `
        background: #fafafa;
        opacity: 0.7;
      `;
    }
    // Partida não finalizada, estilo neutro
    return `
      background: #fafafa;
    `;
  }}

  @media (min-width: 768px) {
    padding: 12px;
  }
`;

const TeamNameInMatch = styled.span`
  font-size: 13px;
  color: #1f2937;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const TeamScore = styled.span<{ $winner?: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => (props.$winner ? "#22c55e" : "#9ca3af")};
  margin-left: 12px;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;

  @media (min-width: 768px) {
    padding: 40px 24px;
  }
`;

const EmptyText = styled.p`
  font-size: 14px;
  margin: 0;
`;

// Partidas dentro do confronto TEAMS
const PartidasTeamsContainer = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
`;

const PartidaTeamsCard = styled.div<{ $finished?: boolean }>`
  background: ${(props) => (props.$finished ? "#f9fafb" : "#fffbeb")};
  border: 1px solid ${(props) => (props.$finished ? "#e5e7eb" : "#fde68a")};
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const PartidaTeamsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const TipoJogoBadge = styled.span<{ $tipo: string }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;

  ${(props) => {
    switch (props.$tipo) {
      case "feminino":
        return `background: #fce7f3; color: #be185d;`;
      case "masculino":
        return `background: #dbeafe; color: #1d4ed8;`;
      case "misto":
        return `background: #d1fae5; color: #047857;`;
      case "decider":
        return `background: #fef3c7; color: #b45309;`;
      default:
        return `background: #f3f4f6; color: #6b7280;`;
    }
  }}
`;

const PartidaTeamsBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DuplaRow = styled.div<{ $winner?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;

  ${(props) =>
    props.$winner
      ? `
    background: #dcfce7;
    border-left: 3px solid #22c55e;
    font-weight: 600;
  `
      : `
    background: #fafafa;
  `}
`;

const DuplaNames = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
`;

const DuplaScore = styled.span<{ $winner?: boolean }>`
  font-weight: 700;
  color: ${(props) => (props.$winner ? "#16a34a" : "#6b7280")};
  margin-left: 8px;
`;

// Seção de Equipes com Jogadores
const EquipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const EquipeCard = styled.div<{ $classificada?: boolean }>`
  background: ${(props) => (props.$classificada ? "#f0fdf4" : "#fafafa")};
  border: 1px solid ${(props) => (props.$classificada ? "#bbf7d0" : "#e5e7eb")};
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const EquipeNome = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
`;

const JogadoresList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const JogadorItem = styled.li`
  padding: 4px 0;
  font-size: 12px;
  color: #4b5563;

  &:not(:last-child) {
    border-bottom: 1px dashed #f3f4f6;
  }
`;

// ============== COMPONENT ==============

const GruposViewer: React.FC<GruposViewerProps> = ({ grupos }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!grupos?.length) {
    return (
      <Wrapper>
        <Header>
          <Title>Fase de Grupos</Title>
        </Header>
        <EmptyBox>
          <EmptyText>Grupos ainda não formados</EmptyText>
        </EmptyBox>
      </Wrapper>
    );
  }

  const formato =
    grupos[0]?.formato ||
    (grupos[0]?.equipes?.length ? "teams" :
     grupos[0]?.jogadores?.length ? "rei_da_praia" : "dupla_fixa");
  const isReiDaPraia = formato === "rei_da_praia";
  const isSuperX = formato === "super_x";
  const isTeams = formato === "teams";

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
  // Super X e Rei da Praia usam jogadores individuais
  const isJogadoresIndividuais = isReiDaPraia || isSuperX;

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
          <FormatoBadge $formato={formato}>
            {isTeams ? "Teams" : isSuperX ? "Super X" : isReiDaPraia ? "Rei da Praia" : "Dupla Fixa"}
          </FormatoBadge>
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

      <GroupsGrid $visible={isExpanded}>
          {gruposOrdenados.map((group) => (
            <GroupCard key={group.id}>
              <GroupHeader $formato={formato} $tipo={group.tipo}>
                <GroupName>{group.nome}</GroupName>
              </GroupHeader>

              <GroupContent>
                {/*  CLASSIFICAÇÃO - Jogadores individuais (Rei da Praia e Super X) */}
                {isJogadoresIndividuais &&
                  group.jogadores &&
                  group.jogadores.length > 0 && (
                    <>
                      <SectionTitle>Classificação</SectionTitle>
                      <TableWrapper>
                        <Table>
                          <colgroup>
                            <col style={{ width: "40px" }} />
                            <col style={{ width: "auto" }} />
                            <col style={{ width: "25px" }} />
                            <col style={{ width: "25px" }} />
                            <col style={{ width: "25px" }} />
                            <col style={{ width: "35px" }} />
                            <col style={{ width: "35px" }} />
                          </colgroup>
                          <THead>
                            <tr>
                              <Th>#</Th>
                              <Th>Jogador</Th>
                              <Th>J</Th>
                              <Th>V</Th>
                              <Th>D</Th>
                              <Th>Pts</Th>
                              <Th>SG</Th>
                            </tr>
                          </THead>
                          <TBody>
                            {group.jogadores.map((jogador, index) => (
                              <Tr
                                key={jogador.id}
                                $qualified={jogador.classificado}
                              >
                                <Td>
                                  <Position $qualified={jogador.classificado}>
                                    {jogador.posicaoGrupo || index + 1}
                                  </Position>
                                </Td>
                                <Td>
                                  <TeamName>{jogador.jogadorNome}</TeamName>
                                </Td>
                                <Td>{jogador.jogosGrupo || 0}</Td>
                                <Td>{jogador.vitoriasGrupo || 0}</Td>
                                <Td>{jogador.derrotasGrupo || 0}</Td>
                                <Td>
                                  <StatBadge>
                                    {jogador.pontosGrupo || 0}
                                  </StatBadge>
                                </Td>
                                <Td>
                                  <StatBadge
                                    $type={
                                      (jogador.saldoGamesGrupo || 0) > 0
                                        ? "positive"
                                        : (jogador.saldoGamesGrupo || 0) < 0
                                        ? "negative"
                                        : "neutral"
                                    }
                                  >
                                    {(jogador.saldoGamesGrupo || 0) > 0
                                      ? "+"
                                      : ""}
                                    {jogador.saldoGamesGrupo || 0}
                                  </StatBadge>
                                </Td>
                              </Tr>
                            ))}
                          </TBody>
                        </Table>
                      </TableWrapper>
                    </>
                  )}

                {/*  CLASSIFICAÇÃO DUPLA FIXA */}
                {!isJogadoresIndividuais && group.duplas && group.duplas.length > 0 && (
                  <>
                    <SectionTitle>Classificação</SectionTitle>
                    <TableWrapper>
                      <Table>
                        <colgroup>
                          <col style={{ width: "40px" }} />
                          <col style={{ width: "auto" }} />
                          <col style={{ width: "20px" }} />
                          <col style={{ width: "20px" }} />
                          <col style={{ width: "20px" }} />
                          <col style={{ width: "30px" }} />
                          <col style={{ width: "32px" }} />
                        </colgroup>
                        <THead>
                          <tr>
                            <Th>#</Th>
                            <Th>Dupla</Th>
                            <Th>J</Th>
                            <Th>V</Th>
                            <Th>D</Th>
                            <Th>Pts</Th>
                            <Th>SG</Th>
                          </tr>
                        </THead>
                        <TBody>
                          {group.duplas.map((team) => (
                            <Tr key={team.id} $qualified={team.classificada}>
                              <Td>
                                <Position $qualified={team.classificada}>
                                  {team.posicaoGrupo}
                                </Position>
                              </Td>
                              <Td>
                                <TeamName>
                                  {team.jogador1Nome} & {team.jogador2Nome}
                                </TeamName>
                              </Td>
                              <Td>{team.jogos}</Td>
                              <Td>{team.vitorias}</Td>
                              <Td>{team.derrotas}</Td>
                              <Td>
                                <StatBadge>{team.pontos}</StatBadge>
                              </Td>
                              <Td>
                                <StatBadge
                                  $type={
                                    team.saldoGames > 0
                                      ? "positive"
                                      : team.saldoGames < 0
                                      ? "negative"
                                      : "neutral"
                                  }
                                >
                                  {team.saldoGames > 0 ? "+" : ""}
                                  {team.saldoGames}
                                </StatBadge>
                              </Td>
                            </Tr>
                          ))}
                        </TBody>
                      </Table>
                    </TableWrapper>
                  </>
                )}

                {/*  EQUIPES com Jogadores (TEAMS) */}
                {isTeams && group.equipes && group.equipes.length > 0 && (
                  <>
                    <SectionTitle>Equipes</SectionTitle>
                    <EquipesGrid>
                      {group.equipes.map((equipe) => (
                        <EquipeCard key={equipe.id} $classificada={equipe.classificada}>
                          <EquipeNome>{equipe.nome}</EquipeNome>

                          {equipe.jogadores && equipe.jogadores.length > 0 && (
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

                {/*  CLASSIFICAÇÃO TEAMS - só mostra se houver estatísticas */}
                {isTeams && group.equipes && group.equipes.length > 0 &&
                 group.equipes.some(e => (e.pontos || 0) > 0 || (e.vitorias || 0) > 0) && (
                  <>
                    <SectionTitle>Classificação</SectionTitle>
                    <TableWrapper>
                      <Table>
                        <colgroup>
                          <col style={{ width: "auto" }} />
                          <col style={{ width: "25px" }} />
                          <col style={{ width: "25px" }} />
                          <col style={{ width: "35px" }} />
                          <col style={{ width: "35px" }} />
                        </colgroup>
                        <THead>
                          <tr>
                            <Th>Equipe</Th>
                            <Th>V</Th>
                            <Th>D</Th>
                            <Th>Pts</Th>
                            <Th>SJ</Th>
                          </tr>
                        </THead>
                        <TBody>
                          {group.equipes.map((equipe) => (
                            <Tr key={equipe.id} $qualified={equipe.classificada}>
                              <Td>
                                <TeamName>{equipe.nome}</TeamName>
                              </Td>
                              <Td>{equipe.vitorias || 0}</Td>
                              <Td>{equipe.derrotas || 0}</Td>
                              <Td>
                                <StatBadge>{equipe.pontos || 0}</StatBadge>
                              </Td>
                              <Td>
                                <StatBadge
                                  $type={
                                    (equipe.saldoJogos || 0) > 0
                                      ? "positive"
                                      : (equipe.saldoJogos || 0) < 0
                                      ? "negative"
                                      : "neutral"
                                  }
                                >
                                  {(equipe.saldoJogos || 0) > 0 ? "+" : ""}
                                  {equipe.saldoJogos || 0}
                                </StatBadge>
                              </Td>
                            </Tr>
                          ))}
                        </TBody>
                      </Table>
                    </TableWrapper>
                  </>
                )}

                {/*  CONFRONTOS TEAMS */}
                {isTeams && group.confrontos && group.confrontos.length > 0 && (
                  <>
                    {/* Não mostrar título "Confrontos" para fases eliminatórias - já está no header */}
                    {group.tipo !== "eliminatoria" && <SectionTitle>Confrontos</SectionTitle>}
                    <MatchesList>
                      {group.confrontos.map((confronto) => {
                        const finished = confronto.status?.toUpperCase() === "FINALIZADO";
                        const winner1 = confronto.vencedoraId === confronto.equipe1Id;
                        const winner2 = confronto.vencedoraId === confronto.equipe2Id;

                        // Helper para formatar tipo de jogo
                        const getTipoJogoLabel = (tipo: string) => {
                          switch (tipo) {
                            case "feminino": return "Feminino";
                            case "masculino": return "Masculino";
                            case "misto": return "Misto";
                            case "decider": return "Decider";
                            default: return tipo;
                          }
                        };

                        // Helper para extrair nomes das duplas
                        const getDuplaNomes = (dupla: any): string => {
                          if (!dupla) return "A definir";
                          // Estrutura DuplaPartidaTeams (objeto com jogador1Nome, jogador2Nome)
                          if (dupla.jogador1Nome && dupla.jogador2Nome) {
                            return `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`;
                          }
                          // Estrutura array de JogadorEquipe
                          if (Array.isArray(dupla) && dupla.length >= 2) {
                            return `${dupla[0]?.nome} & ${dupla[1]?.nome}`;
                          }
                          // Fallback para equipeNome
                          return dupla.equipeNome || "A definir";
                        };

                        return (
                          <MatchCard key={confronto.id} $finished={finished}>
                            <MatchHeader>
                              <Status $status={confronto.status || "agendado"}>
                                {finished
                                  ? "Finalizado"
                                  : confronto.status?.toUpperCase() === "EM_ANDAMENTO"
                                  ? "Ao vivo"
                                  : "Agendado"}
                              </Status>
                            </MatchHeader>

                            <MatchBody>
                              <TeamRow $winner={winner1} $finished={finished}>
                                <TeamNameInMatch>
                                  {confronto.equipe1Nome || "A definir"}
                                </TeamNameInMatch>
                                <TeamScore $winner={winner1}>
                                  {confronto.jogosEquipe1 || 0}
                                </TeamScore>
                              </TeamRow>

                              <VS>VS</VS>

                              <TeamRow $winner={winner2} $finished={finished}>
                                <TeamNameInMatch>
                                  {confronto.equipe2Nome || "A definir"}
                                </TeamNameInMatch>
                                <TeamScore $winner={winner2}>
                                  {confronto.jogosEquipe2 || 0}
                                </TeamScore>
                              </TeamRow>

                              {/* Partidas dentro do confronto */}
                              {confronto.partidas && confronto.partidas.length > 0 && (
                                <PartidasTeamsContainer>
                                  {confronto.partidas.map((partida) => {
                                    const partidaFinished = partida.status?.toUpperCase() === "FINALIZADA";
                                    const dupla1Winner = partida.vencedoraEquipeId === partida.dupla1?.equipeId;
                                    const dupla2Winner = partida.vencedoraEquipeId === partida.dupla2?.equipeId;

                                    const dupla1Nomes = getDuplaNomes(partida.dupla1);
                                    const dupla2Nomes = getDuplaNomes(partida.dupla2);

                                    return (
                                      <PartidaTeamsCard key={partida.id} $finished={partidaFinished}>
                                        <PartidaTeamsHeader>
                                          <TipoJogoBadge $tipo={partida.tipoJogo}>
                                            {getTipoJogoLabel(partida.tipoJogo)}
                                          </TipoJogoBadge>
                                          <Status $status={partida.status || "agendada"}>
                                            {partidaFinished ? "Finalizada" : "Agendada"}
                                          </Status>
                                        </PartidaTeamsHeader>

                                        <PartidaTeamsBody>
                                          <DuplaRow $winner={dupla1Winner}>
                                            <DuplaNames>{dupla1Nomes}</DuplaNames>
                                            {partidaFinished && partida.placar && partida.placar.length > 0 && (
                                              <DuplaScore $winner={dupla1Winner}>
                                                {partida.placar.map(s => s.gamesDupla1).join("-")}
                                              </DuplaScore>
                                            )}
                                          </DuplaRow>

                                          <DuplaRow $winner={dupla2Winner}>
                                            <DuplaNames>{dupla2Nomes}</DuplaNames>
                                            {partidaFinished && partida.placar && partida.placar.length > 0 && (
                                              <DuplaScore $winner={dupla2Winner}>
                                                {partida.placar.map(s => s.gamesDupla2).join("-")}
                                              </DuplaScore>
                                            )}
                                          </DuplaRow>
                                        </PartidaTeamsBody>
                                      </PartidaTeamsCard>
                                    );
                                  })}
                                </PartidasTeamsContainer>
                              )}
                            </MatchBody>
                          </MatchCard>
                        );
                      })}
                    </MatchesList>
                  </>
                )}

                {/*  PARTIDAS - Adaptar por formato */}
                {!isTeams && group.partidas?.length > 0 && (
                  <>
                    <SectionTitle>Partidas</SectionTitle>
                    <MatchesList>
                      {group.partidas.map((match) => {
                        const finished =
                          match.status?.toUpperCase() === "FINALIZADA";

                        // Detectar vencedor: usar sets como fonte primária quando disponível
                        let winner1 = false;
                        let winner2 = false;

                        if (finished) {
                          // Primeiro tenta por sets (mais confiável)
                          if (match.setsDupla1 !== undefined && match.setsDupla2 !== undefined) {
                            winner1 = match.setsDupla1 > match.setsDupla2;
                            winner2 = match.setsDupla2 > match.setsDupla1;
                          }
                          // Fallback: comparação por nomes
                          else if (isJogadoresIndividuais && match.vencedoresNomes) {
                            winner1 = match.vencedoresNomes === match.dupla1Nome;
                            winner2 = match.vencedoresNomes === match.dupla2Nome;
                          } else if (match.vencedoraNome) {
                            winner1 = match.vencedoraNome === match.dupla1Nome;
                            winner2 = match.vencedoraNome === match.dupla2Nome;
                          }
                        }

                        return (
                          <MatchCard key={match.id} $finished={finished}>
                            <MatchHeader>
                              <Status $status={match.status || "agendada"}>
                                {finished
                                  ? "Finalizada"
                                  : match.status?.toUpperCase() ===
                                    "EM_ANDAMENTO"
                                  ? "Ao vivo"
                                  : "Agendada"}
                              </Status>
                            </MatchHeader>

                            <MatchBody>
                              <TeamRow $winner={winner1} $finished={finished}>
                                <TeamNameInMatch>
                                  {match.dupla1Nome}
                                </TeamNameInMatch>
                                {finished &&
                                  match.placar &&
                                  match.placar.length > 0 && (
                                    <TeamScore $winner={winner1}>
                                      {match.placar[0].gamesDupla1}
                                    </TeamScore>
                                  )}
                              </TeamRow>

                              <VS>VS</VS>

                              <TeamRow $winner={winner2} $finished={finished}>
                                <TeamNameInMatch>
                                  {match.dupla2Nome}
                                </TeamNameInMatch>
                                {finished &&
                                  match.placar &&
                                  match.placar.length > 0 && (
                                    <TeamScore $winner={winner2}>
                                      {match.placar[0].gamesDupla2}
                                    </TeamScore>
                                  )}
                              </TeamRow>
                            </MatchBody>
                          </MatchCard>
                        );
                      })}
                    </MatchesList>
                  </>
                )}
              </GroupContent>
            </GroupCard>
          ))}
        </GroupsGrid>
    </Wrapper>
  );
};

export default GruposViewer;
