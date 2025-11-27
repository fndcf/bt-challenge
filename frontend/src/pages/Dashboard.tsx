/**
 * Dashboard - REFATORADO COM RankingList
 * Usa o componente reutilizável RankingList
 */

import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useArena } from "../contexts/ArenaContext";
import { useDocumentTitle } from "../hooks";
import RankingList from "../components/RankingList";
import Footer from "@/components/Footer";

// ===========================
// CONTAINER PRINCIPAL
// ===========================

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// ===========================
// WELCOME BANNER (apenas desktop)
// ===========================

const WelcomeBanner = styled.div`
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  border-radius: 12px;
  padding: 2rem;
  color: white;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const WelcomeText = styled.div`
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
`;

const ArenaBadge = styled.div`
  background: rgba(255, 255, 255, 0.15);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;

  span:first-child {
    font-size: 2rem;
  }

  div {
    p {
      margin: 0;
      font-weight: 600;
    }

    small {
      opacity: 0.8;
      font-size: 0.875rem;
    }
  }
`;

// ===========================
// SEÇÃO
// ===========================

const Section = styled.section`
  margin-bottom: 3rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1.5rem 0;

    @media (max-width: 768px) {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
  }
`;

// ===========================
// AÇÕES RÁPIDAS
// ===========================

const ActionsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ActionCard = styled(Link)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const ActionContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;

    @media (max-width: 768px) {
      font-size: 0.8125rem;
    }
  }
`;

const ActionArrow = styled.div<{ $color: string }>`
  color: ${(props) => props.$color};
  font-size: 1.5rem;
  transition: transform 0.3s;

  ${ActionCard}:hover & {
    transform: translateX(4px);
  }
`;

// ===========================
// PRIMEIROS PASSOS
// ===========================

const StepsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StepCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const StepNumber = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
`;

const StepContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  p {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;

    @media (max-width: 768px) {
      font-size: 0.8125rem;
    }
  }

  a {
    color: #134e5e;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;

    &:hover {
      color: #5568d3;
    }
  }
`;

// ===========================
// COMPONENTE
// ===========================

const Dashboard: React.FC = () => {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { arena } = useArena();

  const actions = [
    {
      label: "Cadastrar Jogador",
      description: "Adicione novos jogadores à arena",
      link: "/admin/jogadores/novo",
      color: "#134e5e",
    },
    {
      label: "Criar Challenge",
      description: "Inicie uma nova etapa de torneio",
      link: "/admin/etapas/criar",
      color: "#f093fb",
    },
    {
      label: "Página Pública",
      description: "Link público para jogadores",
      link: `/arena/${arena?.slug}`,
      color: "#4facfe",
    },
  ];

  return (
    <Container>
      {/* Welcome Banner (apenas desktop) */}
      <WelcomeBanner>
        <WelcomeText>
          <h1>Bem-vindo(a), {user?.email?.split("@")[0]}!</h1>
          <p>Gerencie sua arena e organize torneios incríveis</p>
        </WelcomeText>
        {arena && (
          <ArenaBadge>
            <div>
              <p>{arena.nome}</p>
              <small>/{arena.slug}</small>
            </div>
          </ArenaBadge>
        )}
      </WelcomeBanner>

      {/* Ações Rápidas */}
      <Section>
        <h2>Ações Rápidas</h2>
        <ActionsGrid>
          {actions.map((action, i) => (
            <ActionCard key={i} to={action.link}>
              <ActionContent>
                <h3>{action.label}</h3>
                <p>{action.description}</p>
              </ActionContent>
              <ActionArrow $color={action.color}>→</ActionArrow>
            </ActionCard>
          ))}
        </ActionsGrid>
      </Section>

      {/* ✨ TOP 5 JOGADORES - Usando componente RankingList */}
      <Section>
        <RankingList
          arenaSlug={arena?.slug}
          limitPorNivel={10} // Ignorado quando showPagination=true
          showPagination={true} // Com paginação
          itensPorPagina={5} // 20 jogadores por página
        />
      </Section>

      {/* Primeiros Passos */}
      <Section>
        <h2>Primeiros Passos</h2>
        <StepsGrid>
          <StepCard>
            <StepNumber>1</StepNumber>
            <StepContent>
              <h3>Cadastre Jogadores</h3>
              <p>Comece adicionando os jogadores da sua arena</p>
              <Link to="/admin/jogadores/novo">
                Cadastrar Primeiro Jogador →
              </Link>
            </StepContent>
          </StepCard>

          <StepCard>
            <StepNumber>2</StepNumber>
            <StepContent>
              <h3>Crie um Challenge</h3>
              <p>Organize sua primeira etapa de torneio</p>
              <Link to="/admin/etapas/criar">Criar Challenge →</Link>
            </StepContent>
          </StepCard>

          <StepCard>
            <StepNumber>3</StepNumber>
            <StepContent>
              <h3>Compartilhe sua Arena</h3>
              <p>Divulgue o link público para os jogadores</p>
              {arena && (
                <a
                  href={`/arena/${arena.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver Página Pública →
                </a>
              )}
            </StepContent>
          </StepCard>
        </StepsGrid>
      </Section>
      <Footer></Footer>
    </Container>
  );
};

export default Dashboard;
