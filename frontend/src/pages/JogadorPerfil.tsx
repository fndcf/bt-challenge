import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";
import {
  arenaService,
  JogadorPublico,
  EstatisticasAgregadas,
} from "../services/arenaService";
import { Arena } from "../types/arena";
import Footer from "@/components/Footer";

// ============== STYLED COMPONENTS ==============
// (Manter todos os styled components do arquivo original)

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

  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
  }
`;

const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;

  a {
    color: #2563eb;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #1d4ed8;
    }
  }

  span {
    color: #374151;
    font-weight: 600;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 1.5rem;
  }
`;

const ProfileHeader = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
    padding: 3rem;
  }
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;
    font-size: 3rem;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2.25rem;
    }
  }

  p {
    color: #6b7280;
    margin: 0;
    font-size: 1rem;

    @media (min-width: 768px) {
      font-size: 1.125rem;
    }
  }
`;

const GeneroTag = styled.span<{ $genero: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${
    (props) =>
      props.$genero === "masculino"
        ? "#dbeafe" // Azul claro
        : "#fce7f3" // Rosa claro
  };
  color: ${
    (props) =>
      props.$genero === "masculino"
        ? "#1e40af" // Azul escuro
        : "#9f1239" // Rosa escuro
  };
`;

const NivelTag = styled.span<{ $nivel: string; $genero?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;

  background: ${
    (props) =>
      props.$genero === "masculino"
        ? "#dbeafe" // Azul claro
        : "#fce7f3" // Rosa claro
  };

  color: ${
    (props) =>
      props.$genero === "masculino"
        ? "#1e40af" // Azul escuro
        : "#9f1239" // Rosa escuro
  };
`;

const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const StatValue = styled.div`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  grid-column: 1 / -1;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const HistoricoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HistoricoItem = styled(Link)`
  display: block;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border-left: 4px solid #2563eb;
  transition: all 0.2s;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const HistoricoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const EtapaNome = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 1rem;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const HistoricoDetalhes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 1rem;
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

const ErrorCard = styled(Card)`
  text-align: center;
  grid-column: 1 / -1;
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
`;

const ErrorText = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem 0;
`;

const ErrorButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

// ============== COMPONENTE ==============

const JogadorPerfil: React.FC = () => {
  const { slug, jogadorId } = useParams<{ slug: string; jogadorId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<Arena | null>(null);
  const [jogador, setJogador] = useState<JogadorPublico | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] =
    useState<EstatisticasAgregadas | null>(null);

  // ✅ Helper para pegar o nome do jogador (suporta vários campos)
  const getNomeJogador = (j: JogadorPublico | null): string => {
    if (!j) return "Jogador";
    return (
      j.nome ||
      j.jogadorNome ||
      (j as any).nomeCompleto ||
      (j as any).apelido ||
      "Jogador"
    );
  };

  // ✅ Helper para pegar o nível
  const getNivel = (j: JogadorPublico | null): string | undefined => {
    if (!j) return undefined;
    return j.nivel || j.jogadorNivel || (j as any).categoria;
  };

  // ✅ Helper para pegar o gênero
  const getGenero = (j: JogadorPublico | null): string | undefined => {
    if (!j) return undefined;
    return j.genero || j.jogadorGenero || (j as any).sexo;
  };

  const generoJogador = getGenero(jogador);
  const nomeJogador = getNomeJogador(jogador);
  const nivelJogador = getNivel(jogador);

  useDocumentTitle(
    jogador ? `${nomeJogador} - ${arena?.nome}` : "Perfil do Jogador"
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !jogadorId) {
        setError("Parâmetros inválidos");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Buscar arena
        const arenaData = await arenaService.getArenaPublica(slug);
        setArena(arenaData);

        // Buscar jogador
        const jogadorData = await arenaService.getJogadorPublico(
          slug,
          jogadorId
        );
        if (!jogadorData) {
          throw new Error("Jogador não encontrado");
        }
        setJogador(jogadorData);

        //  Buscar estatísticas agregadas
        const statsData = await arenaService.getEstatisticasAgregadas(
          slug,
          jogadorId
        );
        setEstatisticas(statsData);

        // Buscar histórico
        const historicoData = await arenaService.getHistoricoJogador(
          slug,
          jogadorId
        );
        setHistorico(historicoData || []);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar perfil do jogador");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, jogadorId]);

  const getInitials = (nome: string): string => {
    const parts = nome.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <Spinner />
          <LoadingText>Carregando perfil...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (error || !arena || !jogador) {
    return (
      <PageContainer>
        <Container>
          <ErrorCard>
            <ErrorIcon>❌</ErrorIcon>
            <ErrorTitle>Jogador Não Encontrado</ErrorTitle>
            <ErrorText>
              {error || "O jogador que você está procurando não existe."}
            </ErrorText>
            <ErrorButton onClick={() => navigate(-1)}>Voltar</ErrorButton>
          </ErrorCard>
        </Container>
      </PageContainer>
    );
  }

  // Calcular estatísticas do histórico
  const totalEtapas = estatisticas?.etapasParticipadas || 0; // ✅ CORRETO
  const totalVitorias = estatisticas?.vitorias || 0; // ✅ CORRETO
  const totalDerrotas = estatisticas?.derrotas || 0;
  const posicaoAtual = estatisticas?.posicaoRanking || 0;

  return (
    <PageContainer>
      <Header>
        <HeaderInfo>
          <BackButton onClick={() => navigate(-1)}>← Voltar</BackButton>
        </HeaderInfo>
        <HeaderContent>
          <Breadcrumb>
            <Link to={`/arena/${slug}`}> {arena.nome}</Link>
            <span>›</span>
            <span>{nomeJogador}</span>
          </Breadcrumb>
        </HeaderContent>
      </Header>

      <Container>
        {/* Cabeçalho do Perfil */}
        <ProfileHeader>
          <Avatar>{getInitials(nomeJogador)}</Avatar>
          <ProfileInfo>
            <h1>{nomeJogador}</h1>
            <p>Jogador da {arena.nome}</p>

            {/*  Badges de nível e gênero */}
            <BadgeGroup>
              {nivelJogador && (
                <NivelTag $nivel={nivelJogador} $genero={generoJogador}>
                  {nivelJogador}
                </NivelTag>
              )}
              {generoJogador && (
                <GeneroTag $genero={generoJogador}>{generoJogador}</GeneroTag>
              )}
            </BadgeGroup>
          </ProfileInfo>
          {/* Melhor Posição */}
          <StatCard>
            <StatValue>{posicaoAtual > 0 ? `${posicaoAtual}º` : "-"}</StatValue>
            <StatLabel>Posição no Ranking</StatLabel>
          </StatCard>
        </ProfileHeader>

        {/* Estatísticas */}
        <Grid>
          {/*  Vitórias (soma de todas etapas) */}
          <StatCard>
            <StatValue>{totalVitorias}</StatValue>
            <StatLabel>Vitórias</StatLabel>
          </StatCard>

          {/*  Card de Derrotas */}
          <StatCard>
            <StatValue>{totalDerrotas}</StatValue>
            <StatLabel>Derrotas</StatLabel>
          </StatCard>

          {/* Etapas Participadas */}
          <StatCard>
            <StatValue>{totalEtapas}</StatValue>
            <StatLabel>Etapas Participadas</StatLabel>
          </StatCard>

          {/* Histórico */}
          <Card>
            <CardTitle>Histórico de Participações</CardTitle>
            {historico.length === 0 ? (
              <EmptyState>
                <EmptyText>Nenhuma participação registrada ainda.</EmptyText>
              </EmptyState>
            ) : (
              <HistoricoList>
                {historico.map((item) => (
                  <HistoricoItem
                    key={item.id}
                    to={`/arena/${slug}/etapa/${item.etapaId}`}
                  >
                    <HistoricoHeader>
                      <EtapaNome>{item.etapaNome || "Etapa"}</EtapaNome>
                      <span style={{ fontSize: "1.25rem" }}>→</span>
                    </HistoricoHeader>
                    <HistoricoDetalhes>
                      {/* ✅ Mostrar vitórias/derrotas DESTA etapa */}
                      {item.vitorias !== undefined && (
                        <div>Vitórias: {item.vitorias}</div>
                      )}
                      {item.derrotas !== undefined && (
                        <div>Derrotas: {item.derrotas}</div>
                      )}
                      {item.pontos !== undefined && (
                        <div>Pontos: {item.pontos}</div>
                      )}
                    </HistoricoDetalhes>
                  </HistoricoItem>
                ))}
              </HistoricoList>
            )}
          </Card>
        </Grid>
      </Container>
      <Footer></Footer>
    </PageContainer>
  );
};

export default JogadorPerfil;
