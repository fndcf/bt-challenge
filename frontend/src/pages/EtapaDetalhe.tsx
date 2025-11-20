/**
 * EtapaDetalhes - DESIGN MODERNO DO ZERO
 * Layout limpo + Header perfeito + Responsivo
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";
import {
  arenaService,
  EtapaPublica,
  JogadorPublico,
} from "../services/arenaService";
import { Arena } from "../types";
import BracketViewer from "../components/BracketViewer";
import GruposViewer from "../components/GruposViewer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

// ============== STYLED COMPONENTS ==============

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const TopBar = styled.header`
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
`;

const TopBarInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;

  @media (min-width: 768px) {
    padding: 16px 24px;
  }
`;

const Breadcrumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    font-size: 14px;
    margin-bottom: 16px;
  }
`;

const BreadLink = styled(Link)`
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #2563eb;
  }
`;

const BreadSep = styled.span`
  color: #d1d5db;
`;

const BreadCurrent = styled.span`
  color: #1f2937;
  font-weight: 600;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
`;

const TitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 8px 0;

  @media (min-width: 768px) {
    font-size: 24px;
    margin-bottom: 12px;
  }
`;

const Badge = styled.span<{ $variant: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${(props) => {
    switch (props.$variant) {
      case "aberta":
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case "em_andamento":
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      case "finalizada":
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
      default:
        return `
          background: #fef3c7;
          color: #92400e;
        `;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 6px 14px;
  }
`;

const BackBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 768px) {
    font-size: 14px;
    padding: 10px 20px;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;

  @media (min-width: 768px) {
    padding: 32px 24px;
  }
`;

const Layout = styled.div`
  display: grid;
  gap: 24px;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 360px;
    gap: 32px;
  }
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Aside = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: 1024px) {
    position: sticky;
    top: 100px;
    align-self: start;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const CardHeader = styled.div`
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (min-width: 768px) {
    font-size: 12px;
  }
`;

const InfoValue = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const Desc = styled.p`
  color: #6b7280;
  line-height: 1.6;
  margin: 16px 0 0 0;
  font-size: 14px;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

const PlayersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PlayerItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    transform: translateX(4px);
  }

  @media (min-width: 768px) {
    padding: 14px;
  }
`;

const PlayerNum = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
`;

const PlayerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlayerName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

const PlayerRank = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;

  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
`;

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 14px;
  margin: 0;
`;

const ActionCard = styled(Card)<{ $variant: string }>`
  ${(props) => {
    switch (props.$variant) {
      case "aberta":
        return `
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border: 2px solid #86efac;
        `;
      case "em_andamento":
        return `
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 2px solid #93c5fd;
        `;
      case "finalizada":
        return `
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border: 2px solid #d1d5db;
        `;
      default:
        return "";
    }
  }}
  text-align: center;
`;

const ActionIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ActionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const ActionText = styled.p`
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 20px 0;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

const ActionBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    font-size: 15px;
    padding: 14px 28px;
  }
`;

const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  font-weight: 500;
`;

const ErrorCard = styled(Card)`
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const ErrorText = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 20px 0;
`;

const ErrorBtn = styled(Link)`
  display: inline-flex;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

// ============== COMPONENT ==============

const EtapaDetalhes: React.FC = () => {
  const { slug, etapaId } = useParams<{ slug: string; etapaId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<Arena | null>(null);
  const [etapa, setEtapa] = useState<EtapaPublica | null>(null);
  const [jogadores, setJogadores] = useState<JogadorPublico[]>([]);
  const [chaves, setChaves] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);

  useDocumentTitle(
    etapa ? `${etapa.nome} - ${arena?.nome}` : "Detalhes da Etapa"
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !etapaId) {
        setError("Parâmetros inválidos");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const arenaData = await arenaService.getArenaPublica(slug);
        setArena(arenaData);

        const etapaData = await arenaService.getEtapaPublica(slug, etapaId);
        setEtapa(etapaData);

        const jogadoresData = await arenaService.getJogadoresEtapa(
          slug,
          etapaId
        );
        setJogadores(jogadoresData);

        const gruposData = await arenaService.getGruposEtapa(slug, etapaId);
        setGrupos(gruposData || []);

        const chavesData = await arenaService.getChavesEtapa(slug, etapaId);
        setChaves(chavesData);
      } catch (err: any) {
        console.error("Erro ao carregar etapa:", err);
        setError(err.message || "Erro ao carregar detalhes da etapa");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, etapaId]);

  const formatarData = (data: any) => {
    try {
      if (data && typeof data === "object" && "_seconds" in data) {
        const date = new Date(data._seconds * 1000);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }

      if (typeof data === "string") {
        return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
      }

      if (data instanceof Date) {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }

      return "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "aberta":
        return "Inscrições Abertas";
      case "em_andamento":
        return "Em Andamento";
      case "finalizada":
        return "Finalizada";
      case "planejada":
        return "Em Breve";
      default:
        return status;
    }
  };

  const getActionInfo = () => {
    if (!etapa) return null;

    switch (etapa.status) {
      case "aberta":
        return {
          icon: "✅",
          title: "Inscrições Abertas!",
          text: "Entre em contato para garantir sua vaga nesta etapa.",
        };
      case "em_andamento":
        return {
          icon: "⚡",
          title: "Etapa em Andamento",
          text: "As partidas estão acontecendo. Acompanhe os resultados!",
        };
      case "finalizada":
        return {
          icon: "🏆",
          title: "Etapa Finalizada",
          text: "Confira os resultados e campeões desta etapa.",
        };
      default:
        return {
          icon: "📅",
          title: "Em Breve",
          text: "Esta etapa ainda não está disponível.",
        };
    }
  };

  if (loading) {
    return (
      <Page>
        <Loading>
          <Spinner />
          <LoadingText>Carregando...</LoadingText>
        </Loading>
      </Page>
    );
  }

  if (error || !arena || !etapa) {
    return (
      <Page>
        <Container>
          <ErrorCard>
            <ErrorIcon>❌</ErrorIcon>
            <ErrorTitle>Etapa Não Encontrada</ErrorTitle>
            <ErrorText>
              {error || "A etapa que você está procurando não existe."}
            </ErrorText>
            <ErrorBtn to={slug ? `/arena/${slug}` : "/"}>
              Voltar para Arena
            </ErrorBtn>
          </ErrorCard>
        </Container>
      </Page>
    );
  }

  const actionInfo = getActionInfo();

  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Breadcrumbs>
            <BreadLink to={`/arena/${slug}`}>🎾 {arena.nome}</BreadLink>
            <BreadSep>›</BreadSep>
            <BreadCurrent>{etapa.nome}</BreadCurrent>
          </Breadcrumbs>

          <HeaderRow>
            <TitleArea>
              <PageTitle>
                #{etapa.numero} {etapa.nome}
              </PageTitle>
              <Badge $variant={etapa.status}>
                {getStatusLabel(etapa.status)}
              </Badge>
            </TitleArea>
            <BackBtn to={`/arena/${slug}`}>← Voltar</BackBtn>
          </HeaderRow>
        </TopBarInner>
      </TopBar>

      <Container>
        <Layout>
          <Main>
            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Informações da Etapa</CardTitle>
              </CardHeader>
              <InfoGrid>
                <InfoBox>
                  <InfoLabel>Data</InfoLabel>
                  <InfoValue>{formatarData(etapa.dataRealizacao)}</InfoValue>
                </InfoBox>
                <InfoBox>
                  <InfoLabel>Formato</InfoLabel>
                  <InfoValue>{etapa.formato}</InfoValue>
                </InfoBox>
                <InfoBox>
                  <InfoLabel>Jogadores</InfoLabel>
                  <InfoValue>{jogadores.length} inscritos</InfoValue>
                </InfoBox>
              </InfoGrid>
              {etapa.descricao && <Desc>{etapa.descricao}</Desc>}
            </Card>

            {/* Players */}
            <Card>
              <CardHeader>
                <CardTitle>
                  👥 Jogadores Inscritos ({jogadores.length})
                </CardTitle>
              </CardHeader>
              {jogadores.length === 0 ? (
                <EmptyBox>
                  <EmptyIcon>👤</EmptyIcon>
                  <EmptyText>Nenhum jogador inscrito</EmptyText>
                </EmptyBox>
              ) : (
                <PlayersList>
                  {jogadores.map((player, idx) => (
                    <PlayerItem
                      key={player.id}
                      to={`/arena/${slug}/jogador/${player.id}`}
                    >
                      <PlayerNum>{player.seed || idx + 1}</PlayerNum>
                      <PlayerInfo>
                        <PlayerName>{player.nome}</PlayerName>
                        {player.ranking && (
                          <PlayerRank>📊 Ranking: #{player.ranking}</PlayerRank>
                        )}
                      </PlayerInfo>
                    </PlayerItem>
                  ))}
                </PlayersList>
              )}
            </Card>

            {/* Groups */}
            {grupos?.length > 0 && <GruposViewer grupos={grupos} />}

            {/* Bracket */}
            {chaves && <BracketViewer chaves={chaves} />}
          </Main>

          <Aside>
            {/* Action */}
            {actionInfo && (
              <ActionCard $variant={etapa.status}>
                <ActionIcon>{actionInfo.icon}</ActionIcon>
                <ActionTitle>{actionInfo.title}</ActionTitle>
                <ActionText>{actionInfo.text}</ActionText>
                {etapa.status === "aberta" && (
                  <ActionBtn
                    href={`mailto:contato@${slug}.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ✉️ Entre em Contato
                  </ActionBtn>
                )}
              </ActionCard>
            )}

            {/* Arena Info */}
            <Card>
              <CardHeader>
                <CardTitle>🏟️ Arena</CardTitle>
              </CardHeader>
              <InfoBox>
                <InfoLabel>Nome</InfoLabel>
                <InfoValue>{arena.nome}</InfoValue>
              </InfoBox>
            </Card>
          </Aside>
        </Layout>
      </Container>
    </Page>
  );
};

export default EtapaDetalhes;
