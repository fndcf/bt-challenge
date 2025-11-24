import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Etapa, StatusEtapa, FiltrosEtapa } from "../../types/etapa";
import etapaService from "../../services/etapaService";
import { EtapaCard } from "../../components/etapas/EtapaCard";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import Footer from "@/components/Footer";

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 640px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const HeaderContent = styled.div`
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    width: auto;
    font-size: 1rem;
  }

  span {
    font-size: 1.25rem;
  }
`;

// ============== ESTATÍSTICAS ==============

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

// ============== FILTROS ==============

const FiltersCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const FiltersContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

const FilterLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
`;

const Select = styled.select`
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (min-width: 768px) {
    min-width: 200px;
  }
`;

const ClearButton = styled.button`
  font-size: 0.875rem;
  color: #6b7280;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
`;

// ============== CONTEÚDO ==============

const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const EmptyText = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const EtapasGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== COMPONENTE ==============

export const ListagemEtapas: React.FC = () => {
  const navigate = useNavigate();

  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<StatusEtapa | "">("");
  const [filtroNivel, setFiltroNivel] = useState<NivelJogador | "">(""); // ✅ NOVO
  const [filtroGenero, setFiltroGenero] = useState<GeneroJogador | "">(""); // ✅ NOVO
  const [ordenacao, setOrdenacao] = useState<"dataRealizacao" | "criadoEm">(
    "dataRealizacao"
  );

  // Estatísticas
  const [stats, setStats] = useState({
    totalEtapas: 0,
    inscricoesAbertas: 0,
    emAndamento: 0,
    finalizadas: 0,
  });

  useEffect(() => {
    carregarDados();
  }, [filtroStatus, filtroNivel, filtroGenero, ordenacao]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const filtros: FiltrosEtapa = {
        ordenarPor: ordenacao,
        ordem: "desc",
        limite: 50,
      };

      if (filtroStatus) {
        filtros.status = filtroStatus;
      }

      // ✅ ADICIONAR filtros de nível e gênero
      if (filtroNivel) {
        filtros.nivel = filtroNivel;
      }

      if (filtroGenero) {
        filtros.genero = filtroGenero;
      }

      const [resultado, estatisticas] = await Promise.all([
        etapaService.listar(filtros),
        etapaService.obterEstatisticas(),
      ]);

      setEtapas(resultado.etapas);
      setStats(estatisticas);
    } catch (err: any) {
      console.error("Erro ao carregar etapas:", err);
      setError(err.response?.data?.error || "Erro ao carregar etapas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>Etapas</Title>
          <Subtitle>Gerencie as etapas do torneio</Subtitle>
        </HeaderContent>
        <CreateButton onClick={() => navigate("/admin/etapas/criar")}>
          Criar Etapa
        </CreateButton>
      </Header>

      {/* Estatísticas */}
      <StatsGrid>
        <StatCard>
          <StatContent>
            <StatLabel>Total de Etapas</StatLabel>
            <StatValue>{stats.totalEtapas}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatContent>
            <StatLabel>Inscrições Abertas</StatLabel>
            <StatValue>{stats.inscricoesAbertas}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatContent>
            <StatLabel>Em Andamento</StatLabel>
            <StatValue>{stats.emAndamento}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatContent>
            <StatLabel>Finalizadas</StatLabel>
            <StatValue>{stats.finalizadas}</StatValue>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Filtros */}
      <FiltersCard>
        <FiltersContent>
          <FilterGroup>
            <FilterLabel>Filtrar por:</FilterLabel>
            <Select
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value as StatusEtapa | "")
              }
            >
              <option value="">Todos os status</option>
              <option value={StatusEtapa.INSCRICOES_ABERTAS}>
                Inscrições Abertas
              </option>
              <option value={StatusEtapa.INSCRICOES_ENCERRADAS}>
                Inscrições Encerradas
              </option>
              <option value={StatusEtapa.CHAVES_GERADAS}>Chaves Geradas</option>
              <option value={StatusEtapa.EM_ANDAMENTO}>Em Andamento</option>
              <option value={StatusEtapa.FINALIZADA}>Finalizadas</option>
            </Select>
          </FilterGroup>

          {/* ✅ NOVO: Filtro de Nível */}
          <FilterGroup>
            <FilterLabel>Nível:</FilterLabel>
            <Select
              value={filtroNivel}
              onChange={(e) =>
                setFiltroNivel(e.target.value as NivelJogador | "")
              }
            >
              <option value="">Todos os níveis</option>
              <option value={NivelJogador.INICIANTE}>Iniciante</option>
              <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
              <option value={NivelJogador.AVANCADO}>Avançado</option>
            </Select>
          </FilterGroup>

          {/* ✅ NOVO: Filtro de Gênero */}
          <FilterGroup>
            <FilterLabel>Gênero:</FilterLabel>
            <Select
              value={filtroGenero}
              onChange={(e) =>
                setFiltroGenero(e.target.value as GeneroJogador | "")
              }
            >
              <option value="">Todos os gêneros</option>
              <option value={GeneroJogador.MASCULINO}>Masculino</option>
              <option value={GeneroJogador.FEMININO}>Feminino</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Ordenar por:</FilterLabel>
            <Select
              value={ordenacao}
              onChange={(e) =>
                setOrdenacao(e.target.value as "dataRealizacao" | "criadoEm")
              }
            >
              <option value="dataRealizacao">Data de Realização</option>
              <option value="criadoEm">Data de Criação</option>
            </Select>
          </FilterGroup>

          {/* ✅ ATUALIZAR condição do botão limpar */}
          {(filtroStatus ||
            filtroNivel ||
            filtroGenero ||
            ordenacao !== "dataRealizacao") && (
            <ClearButton
              onClick={() => {
                setFiltroStatus("");
                setFiltroNivel(""); // ✅ ADICIONAR
                setFiltroGenero(""); // ✅ ADICIONAR
                setOrdenacao("dataRealizacao");
              }}
            >
              Limpar filtros
            </ClearButton>
          )}
        </FiltersContent>
      </FiltersCard>

      {/* Lista de Etapas */}
      {error && <ErrorBox>{error}</ErrorBox>}

      {etapas.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Nenhuma etapa encontrada</EmptyTitle>
          <EmptyText>
            {filtroStatus || filtroNivel || filtroGenero
              ? "Não há etapas com esse status."
              : "Comece criando sua primeira etapa!"}
          </EmptyText>
          {!filtroStatus && (
            <CreateButton onClick={() => navigate("/admin/etapas/criar")}>
              Criar Primeira Etapa
            </CreateButton>
          )}
        </EmptyState>
      ) : (
        <EtapasGrid>
          {etapas.map((etapa) => (
            <EtapaCard key={etapa.id} etapa={etapa} />
          ))}
        </EtapasGrid>
      )}
      <Footer></Footer>
    </Container>
  );
};

export default ListagemEtapas;
