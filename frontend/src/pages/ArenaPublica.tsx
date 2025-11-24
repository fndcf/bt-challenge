/**
 * ArenaPublica - REFATORADO COM RankingList
 * URL: /arena/:slug
 * Usa o componente reutilizável RankingList
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";
import { arenaService, EtapaPublica } from "../services/arenaService";
import { Arena } from "../types";
import RankingList from "../components/RankingList";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import Footer from "@/components/Footer";
import { FormatoEtapa } from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
  }
`;

const ArenaInfo = styled.div`
  flex: 1;

  h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.25rem 0;

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const LoginButton = styled(Link)`
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
    padding: 0.875rem 2rem;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 4rem 2rem;
  }
`;

const WelcomeCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const WelcomeTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const WelcomeText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

const EtapasGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EtapaCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const EtapaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const EtapaNumero = styled.div`
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const EtapaStatus = styled.span<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) => {
    switch (props.$status) {
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
`;

const EtapaNome = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const EtapaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;

  strong {
    color: #374151;
    font-weight: 600;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const EtapaDescricao = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const VerMaisButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: 1.125rem;
  font-weight: 500;
`;

const ErrorContainer = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
  }
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

const ErrorText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0 0 1.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

// ============== COMPONENTE ==============

const ArenaPublica: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<Arena | null>(null);
  const [etapas, setEtapas] = useState<EtapaPublica[]>([]);

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

  useDocumentTitle(arena ? arena.nome : "Arena");

  useEffect(() => {
    const fetchArenaData = async () => {
      if (!slug) {
        setError("Arena não encontrada");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Buscar arena pública
        const arenaData = await arenaService.getArenaPublica(slug);
        setArena(arenaData);

        // Buscar etapas públicas
        const etapasData = await arenaService.getEtapasPublicas(slug);
        setEtapas(etapasData);
      } catch (err: any) {
        console.error("Erro ao carregar arena:", err);
        setError(err.message || "Erro ao carregar informações da arena");
      } finally {
        setLoading(false);
      }
    };

    fetchArenaData();
  }, [slug]);

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

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <Spinner />
          <LoadingText>Carregando arena...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (error || !arena) {
    return (
      <PageContainer>
        <Container>
          <ErrorContainer>
            <ErrorIcon>❌</ErrorIcon>
            <ErrorTitle>Arena Não Encontrada</ErrorTitle>
            <ErrorText>
              {error || "A arena que você está procurando não existe."}
            </ErrorText>
            <BackButton to="/">Voltar para o Início</BackButton>
          </ErrorContainer>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <ArenaInfo>
            <h1>{arena.nome}</h1>
            <p>Torneios e Desafios de Beach Tennis</p>
          </ArenaInfo>
          <LoginButton to="/login">Área do Admin</LoginButton>
        </HeaderContent>
      </Header>

      <Container>
        <WelcomeCard>
          <WelcomeTitle>Bem-vindo à {arena.nome}!</WelcomeTitle>
          <WelcomeText>
            Confira as etapas disponíveis e participe dos nossos torneios de
            Beach Tennis. Acompanhe os resultados e desafie outros jogadores!
          </WelcomeText>
        </WelcomeCard>

        <SectionTitle>Etapas e Torneios</SectionTitle>

        {etapas.length === 0 ? (
          <EmptyState>
            <EmptyTitle>Nenhuma Etapa Disponível</EmptyTitle>
            <EmptyText>
              Não há etapas cadastradas no momento. Fique atento para novos
              torneios!
            </EmptyText>
          </EmptyState>
        ) : (
          <EtapasGrid>
            {etapas.map((etapa) => (
              <EtapaCard key={etapa.id}>
                <EtapaHeader>
                  <EtapaNumero>#{etapa.numero}</EtapaNumero>
                  <EtapaStatus $status={etapa.status}>
                    {getStatusLabel(etapa.status)}
                  </EtapaStatus>
                </EtapaHeader>

                <EtapaNome>{etapa.nome}</EtapaNome>

                <EtapaInfo>
                  <InfoItem>
                    <strong>Data:</strong> {formatarData(etapa.dataRealizacao)}
                  </InfoItem>

                  {/* ✅ NOVO: Nível */}
                  {etapa.nivel && (
                    <InfoItem>
                      <strong>Nível:</strong> {getNivelLabel(etapa.nivel)}
                    </InfoItem>
                  )}

                  {/* ✅ NOVO: Gênero */}
                  {etapa.genero && (
                    <InfoItem>
                      <strong>Gênero:</strong> {getGeneroLabel(etapa.genero)}
                    </InfoItem>
                  )}

                  {etapa.totalJogadores !== undefined && (
                    <InfoItem>
                      <strong>Jogadores:</strong> {etapa.totalJogadores}
                    </InfoItem>
                  )}

                  <InfoItem>
                    <strong>Formato:</strong> {getFormatoLabel(etapa.formato)}
                  </InfoItem>
                </EtapaInfo>

                {etapa.descricao && (
                  <EtapaDescricao>{etapa.descricao}</EtapaDescricao>
                )}

                <VerMaisButton to={`/arena/${slug}/etapa/${etapa.id}`}>
                  Ver Detalhes
                </VerMaisButton>
              </EtapaCard>
            ))}
          </EtapasGrid>
        )}

        {/* ✨ RANKING - Usando componente RankingList */}
        <SectionTitle>Ranking Completo</SectionTitle>
        <RankingList
          arenaSlug={slug}
          limitPorNivel={10} // Ignorado quando showPagination=true
          showPagination={true} // Com paginação
          itensPorPagina={5} // 20 jogadores por página
        />
      </Container>

      <Footer></Footer>
    </PageContainer>
  );
};

export default ArenaPublica;
