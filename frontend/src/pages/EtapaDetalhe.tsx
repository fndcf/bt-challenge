/**
 * EtapaDetalhes - DESIGN MODERNO DO ZERO
 * Layout limpo + Header perfeito + Responsivo
 */

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { FormatoEtapa } from "@/types/etapa";

// ============== STYLED COMPONENTS ==============

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
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

const NivelBadge = styled.span<{ $nivel: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;

  ${(props) => {
    switch (props.$nivel) {
      case "iniciante":
        return `background: #dcfce7; color: #166534;`;
      case "intermediario":
        return `background: #dbeafe; color: #1e40af;`;
      case "avancado":
        return `background: #fed7aa; color: #9a3412;`;
      default:
        return `background: #f3f4f6; color: #6b7280;`;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 5px 12px;
  }
`;

const GeneroBadge = styled.span<{ $genero: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;

  ${(props) => {
    switch (props.$genero) {
      case "masculino":
        return `background: #dbeafe; color: #1e40af;`;
      case "feminino":
        return `background: #fce7f3; color: #9f1239;`;
      default:
        return `background: #f3f4f6; color: #6b7280;`;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 5px 12px;
  }
`;

const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const BackButton = styled.button`
  background: #f3f4f6;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
    padding: 0.875rem 2rem;
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
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
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

const EmptyText = styled.p`
  font-size: 14px;
  margin: 0;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<Arena | null>(null);
  const [etapa, setEtapa] = useState<EtapaPublica | null>(null);
  const [jogadores, setJogadores] = useState<JogadorPublico[]>([]);
  const [chaves, setChaves] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);

  const getFormatoLabel = (formato: FormatoEtapa | string) => {
    switch (formato) {
      case FormatoEtapa.DUPLA_FIXA:
        return "Dupla Fixa";
      case FormatoEtapa.REI_DA_PRAIA:
        return "Rei da Praia";
      default:
        return formato;
    }
  };

  const getNivelLabel = (nivel: NivelJogador | string) => {
    switch (nivel) {
      case NivelJogador.INICIANTE:
        return "Iniciante";
      case NivelJogador.INTERMEDIARIO:
        return "Intermediário";
      case NivelJogador.AVANCADO:
        return "Avançado";
      default:
        return nivel;
    }
  };

  const getGeneroLabel = (genero: GeneroJogador | string) => {
    switch (genero) {
      case GeneroJogador.FEMININO:
        return "Feminino";
      case GeneroJogador.MASCULINO:
        return "Masculino";
      default:
        return genero;
    }
  };

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

  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Breadcrumbs>
            <BreadLink to={`/arena/${slug}`}> {arena.nome}</BreadLink>
            <BreadSep>›</BreadSep>
            <BreadCurrent>{etapa.nome}</BreadCurrent>
          </Breadcrumbs>

          <HeaderRow>
            <TitleArea>
              <PageTitle>
                #{etapa.numero} {etapa.nome}
              </PageTitle>

              {/*  Badges de status, nível e gênero */}
              <BadgeGroup>
                <Badge $variant={etapa.status}>
                  {getStatusLabel(etapa.status)}
                </Badge>

                {etapa.nivel && (
                  <NivelBadge $nivel={etapa.nivel}>{etapa.nivel}</NivelBadge>
                )}

                {etapa.genero && (
                  <GeneroBadge $genero={etapa.genero}>
                    {etapa.genero}
                  </GeneroBadge>
                )}
              </BadgeGroup>
            </TitleArea>
            <BackButton onClick={() => navigate(-1)}>← Voltar</BackButton>
          </HeaderRow>
        </TopBarInner>
      </TopBar>

      <Container>
        <Layout>
          <Main>
            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Etapa</CardTitle>
              </CardHeader>
              <InfoGrid>
                <InfoBox>
                  <InfoLabel>Data</InfoLabel>
                  <InfoValue>{formatarData(etapa.dataRealizacao)}</InfoValue>
                </InfoBox>

                <InfoBox>
                  <InfoLabel>Formato</InfoLabel>
                  <InfoValue>{getFormatoLabel(etapa.formato)}</InfoValue>
                </InfoBox>

                {/*  Nível */}
                {etapa.nivel && (
                  <InfoBox>
                    <InfoLabel>Nível</InfoLabel>
                    <InfoValue>{getNivelLabel(etapa.nivel)}</InfoValue>
                  </InfoBox>
                )}

                {/*  Gênero */}
                {etapa.genero && (
                  <InfoBox>
                    <InfoLabel>Gênero</InfoLabel>
                    <InfoValue>{getGeneroLabel(etapa.genero)}</InfoValue>
                  </InfoBox>
                )}

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
                <CardTitle>Jogadores Inscritos ({jogadores.length})</CardTitle>
              </CardHeader>
              {jogadores.length === 0 ? (
                <EmptyBox>
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
                          <PlayerRank>Ranking: #{player.ranking}</PlayerRank>
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
            {/* Arena Info */}
            <Card>
              <CardHeader>
                <CardTitle>Arena</CardTitle>
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
