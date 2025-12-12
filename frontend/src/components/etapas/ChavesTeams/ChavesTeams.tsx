import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import { Equipe, ConfrontoEquipe, StatusConfronto, VarianteTeams } from "@/types/teams";
import { ConfrontosTeams } from "../ConfrontosTeams";

interface ChavesTeamsProps {
  etapaId: string;
  arenaId?: string;
  varianteTeams?: VarianteTeams;
  etapaFinalizada?: boolean;
  onAtualizar?: () => void;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #581c87;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const VarianteBadge = styled.span`
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Stats = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const _SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #374151;
  margin: 2rem 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
// Exported for potential future use
export { _SectionTitle as SectionTitle };

const GrupoSection = styled.div`
  margin-bottom: 2rem;
`;

const GrupoTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #581c87;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GrupoBadge = styled.span<{ $grupo: string }>`
  background: ${(props) => {
    switch (props.$grupo) {
      case "A":
        return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
      case "B":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      default:
        return "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)";
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const EquipesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EquipeCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const EquipeHeader = styled.div<{ $posicao: number }>`
  background: ${(props) => {
    if (props.$posicao === 1) return "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
    if (props.$posicao === 2) return "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
    if (props.$posicao === 3) return "linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)";
    return "linear-gradient(135deg, #059669 0%, #047857 100%)";
  }};
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EquipeNome = styled.h4`
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
`;

const PosicaoBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
`;

const EquipeContent = styled.div`
  padding: 1rem;
`;

const JogadoresList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const JogadorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.375rem;
`;

const JogadorNome = styled.span`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  flex: 1;
`;

const NivelBadge = styled.span<{ $nivel: string }>`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$nivel) {
      case "iniciante":
        return `background: #dcfce7; color: #166534;`;
      case "intermediario":
        return `background: #fef3c7; color: #92400e;`;
      case "avancado":
        return `background: #fee2e2; color: #991b1b;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const GeneroBadge = styled.span<{ $genero: string }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$genero) {
      case "masculino":
        return `background: #dbeafe; color: #1e40af;`;
      case "feminino":
        return `background: #fce7f3; color: #9d174d;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
`;

const StatLabel = styled.div`
  font-size: 0.6875rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
`;

const StatValue = styled.div<{
  $variant?: "primary" | "success" | "error" | "neutral";
}>`
  font-weight: 700;
  font-size: 1rem;

  color: ${(props) => {
    switch (props.$variant) {
      case "primary":
        return "#059669";
      case "success":
        return "#16a34a";
      case "error":
        return "#dc2626";
      default:
        return "#374151";
    }
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const Spinner = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #dcfce7;
  border-top-color: #059669;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const InfoCard = styled.div`
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;

  h4 {
    color: #166534;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
  }

  p {
    color: #166534;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    color: #166534;
    font-size: 0.875rem;
  }

  li {
    margin-top: 0.25rem;
  }
`;

const TabContainer = styled.div`
  margin-top: 2rem;
`;

const TabNav = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  gap: 0.5rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;

  ${(props) =>
    props.$active
      ? `
    color: #059669;
    border-bottom-color: #059669;
  `
      : `
    color: #6b7280;
    &:hover {
      color: #374151;
    }
  `}
`;

const TabContent = styled.div`
  padding: 1.5rem 0;
`;

// ============== HELPERS ==============

const getNivelLabel = (nivel?: string): string => {
  if (!nivel) return "";
  switch (nivel) {
    case "iniciante":
      return "INI";
    case "intermediario":
      return "INT";
    case "avancado":
      return "AVA";
    default:
      return nivel.substring(0, 3).toUpperCase();
  }
};

const getGeneroLabel = (genero?: string): string => {
  if (!genero) return "";
  switch (genero) {
    case "masculino":
      return "M";
    case "feminino":
      return "F";
    default:
      return "";
  }
};

const getVarianteInfo = (
  variante?: VarianteTeams
): { nome: string; jogadoresPorEquipe: number; jogosPorConfronto: number } => {
  switch (variante) {
    case VarianteTeams.TEAMS_4:
      return { nome: "TEAMS 4", jogadoresPorEquipe: 4, jogosPorConfronto: 2 };
    case VarianteTeams.TEAMS_6:
      return { nome: "TEAMS 6", jogadoresPorEquipe: 6, jogosPorConfronto: 3 };
    default:
      return { nome: "TEAMS", jogadoresPorEquipe: 4, jogosPorConfronto: 2 };
  }
};

// ============== COMPONENTE ==============

export const ChavesTeams: React.FC<ChavesTeamsProps> = ({
  etapaId,
  varianteTeams,
  etapaFinalizada = false,
  onAtualizar,
}) => {
  const teamsService = getTeamsService();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [confrontos, setConfrontos] = useState<ConfrontoEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"equipes" | "confrontos">("equipes");

  const varianteInfo = getVarianteInfo(varianteTeams);

  useEffect(() => {
    carregarDados();
  }, [etapaId]);

  // Carrega dados localmente (sem notificar o pai)
  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }
      setError(null);

      const [equipesData, confrontosData] = await Promise.all([
        teamsService.buscarEquipes(etapaId),
        teamsService.buscarConfrontos(etapaId),
      ]);

      // Ordenar equipes por posicao ou pontos
      const equipesOrdenadas = [...equipesData].sort((a, b) => {
        if (a.posicao !== undefined && b.posicao !== undefined) {
          return a.posicao - b.posicao;
        }
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.saldoJogos !== b.saldoJogos) return b.saldoJogos - a.saldoJogos;
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        return a.nome.localeCompare(b.nome);
      });

      setEquipes(equipesOrdenadas);
      setConfrontos(confrontosData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Chamado quando há uma ação do usuário (registrar resultado, gerar partidas, etc)
  // Recarrega dados locais e notifica o pai para atualizar todasPartidasFinalizadas
  const handleAtualizarComNotificacao = async () => {
    await carregarDados(true);
    if (onAtualizar) {
      onAtualizar();
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <strong>Erro:</strong> {error}
        </ErrorContainer>
      </Container>
    );
  }

  if (equipes.length === 0) {
    return (
      <Container>
        <EmptyState>Nenhuma equipe gerada ainda</EmptyState>
      </Container>
    );
  }

  // Verificar se tem fase de grupos
  const temFaseGrupos = equipes.some((e) => e.grupoId);

  // Agrupar equipes por grupo
  const equipesPorGrupo = temFaseGrupos
    ? equipes.reduce((acc, equipe) => {
        const grupoId = equipe.grupoId || "A";
        if (!acc[grupoId]) {
          acc[grupoId] = [];
        }
        acc[grupoId].push(equipe);
        return acc;
      }, {} as Record<string, typeof equipes>)
    : null;

  // Ordenar equipes dentro de cada grupo
  if (equipesPorGrupo) {
    Object.keys(equipesPorGrupo).forEach((grupoId) => {
      equipesPorGrupo[grupoId].sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.saldoJogos !== b.saldoJogos) return b.saldoJogos - a.saldoJogos;
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        return a.nome.localeCompare(b.nome);
      });
    });
  }

  // Função para renderizar card de equipe
  const renderEquipeCard = (equipe: Equipe, index: number) => (
    <EquipeCard key={equipe.id}>
      <EquipeHeader $posicao={index + 1}>
        <EquipeNome>{equipe.nome}</EquipeNome>
        <PosicaoBadge>#{index + 1}</PosicaoBadge>
      </EquipeHeader>

      <EquipeContent>
        <JogadoresList>
          {equipe.jogadores.map((jogador) => (
            <JogadorItem key={jogador.id}>
              <JogadorNome>{jogador.nome}</JogadorNome>
              {jogador.genero && (
                <GeneroBadge $genero={jogador.genero}>
                  {getGeneroLabel(jogador.genero)}
                </GeneroBadge>
              )}
              {jogador.nivel && (
                <NivelBadge $nivel={jogador.nivel}>
                  {getNivelLabel(jogador.nivel)}
                </NivelBadge>
              )}
            </JogadorItem>
          ))}
        </JogadoresList>

        <StatsGrid>
          <StatItem>
            <StatLabel>PTS</StatLabel>
            <StatValue $variant="primary">{equipe.pontos}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>V-D</StatLabel>
            <StatValue>
              {equipe.vitorias}-{equipe.derrotas}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>SJ</StatLabel>
            <StatValue
              $variant={
                equipe.saldoJogos > 0
                  ? "success"
                  : equipe.saldoJogos < 0
                  ? "error"
                  : "neutral"
              }
            >
              {equipe.saldoJogos > 0 ? "+" : ""}
              {equipe.saldoJogos}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>GF</StatLabel>
            <StatValue>{equipe.gamesVencidos}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>GC</StatLabel>
            <StatValue>{equipe.gamesPerdidos}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>SG</StatLabel>
            <StatValue
              $variant={
                equipe.saldoGames > 0
                  ? "success"
                  : equipe.saldoGames < 0
                  ? "error"
                  : "neutral"
              }
            >
              {equipe.saldoGames > 0 ? "+" : ""}
              {equipe.saldoGames}
            </StatValue>
          </StatItem>
        </StatsGrid>
      </EquipeContent>
    </EquipeCard>
  );

  const confrontosFinalizados = confrontos.filter(
    (c) => c.status === StatusConfronto.FINALIZADO
  ).length;

  return (
    <Container>
      <Header>
        <Title>
          {varianteInfo.nome}
          <VarianteBadge>Equipes</VarianteBadge>
        </Title>
        <Stats>
          {equipes.length} equipes - {confrontos.length} confrontos ({confrontosFinalizados} finalizados)
        </Stats>
      </Header>

      <TabContainer>
        <TabNav>
          <TabButton
            $active={abaAtiva === "equipes"}
            onClick={() => setAbaAtiva("equipes")}
          >
            Classificacao ({equipes.length})
          </TabButton>
          <TabButton
            $active={abaAtiva === "confrontos"}
            onClick={() => setAbaAtiva("confrontos")}
          >
            Confrontos ({confrontos.length})
          </TabButton>
        </TabNav>

        <TabContent>
          {abaAtiva === "equipes" && (
            <>
              {temFaseGrupos && equipesPorGrupo ? (
                // Renderizar equipes agrupadas por grupo
                Object.keys(equipesPorGrupo)
                  .sort()
                  .map((grupoId) => (
                    <GrupoSection key={grupoId}>
                      <GrupoTitle>
                        <GrupoBadge $grupo={grupoId}>Grupo {grupoId}</GrupoBadge>
                        <span>({equipesPorGrupo[grupoId].length} equipes)</span>
                      </GrupoTitle>
                      <EquipesGrid>
                        {equipesPorGrupo[grupoId].map((equipe, index) =>
                          renderEquipeCard(equipe, index)
                        )}
                      </EquipesGrid>
                    </GrupoSection>
                  ))
              ) : (
                // Renderizar todas equipes juntas
                <EquipesGrid>
                  {equipes.map((equipe, index) => renderEquipeCard(equipe, index))}
                </EquipesGrid>
              )}

              <InfoCard>
                <h4>Formato {varianteInfo.nome}</h4>
                <p>
                  Campeonato por equipes onde cada equipe tem {varianteInfo.jogadoresPorEquipe} jogadores.
                  {temFaseGrupos
                    ? " Com 6+ equipes: fase de grupos + eliminatorias (top 2 de cada grupo)."
                    : " As equipes jogam todas contra todas (round-robin)."}
                </p>
                <ul>
                  <li>Cada confronto tem {varianteInfo.jogosPorConfronto} jogos{varianteTeams === VarianteTeams.TEAMS_4 ? " (+1 decider se empate 1-1)" : ""}</li>
                  <li>Vitoria no confronto = 3 pontos</li>
                  <li>Desempate: saldo de jogos, depois saldo de games</li>
                  {temFaseGrupos && <li>Os 2 melhores de cada grupo vao para as semifinais</li>}
                </ul>
              </InfoCard>
            </>
          )}

          {abaAtiva === "confrontos" && (
            <ConfrontosTeams
              etapaId={etapaId}
              confrontos={confrontos}
              equipes={equipes}
              varianteTeams={varianteTeams}
              etapaFinalizada={etapaFinalizada}
              onAtualizarLocal={() => carregarDados(true)}
              onAtualizar={handleAtualizarComNotificacao}
            />
          )}
        </TabContent>
      </TabContainer>
    </Container>
  );
};

export default ChavesTeams;
