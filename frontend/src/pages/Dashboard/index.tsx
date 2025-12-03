/**
 * Dashboard/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da página Dashboard
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - ISP: Interfaces específicas para cada componente
 * - DIP: Componentes dependem de abstrações (props), não de implementações
 */

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useArena } from "@/contexts/ArenaContext";
import { useDocumentTitle } from "@/hooks";
import Footer from "@/components/Footer";
import RankingList from "@/components/RankingList";
import { useDashboard } from "./hooks/useDashboard";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { StatsCards } from "./components/StatsCards";
import { QuickActions } from "./components/QuickActions";
import * as S from "./Dashboard.styles";

export const Dashboard: React.FC = () => {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { arena } = useArena();

  // Hook centralizado com toda a lógica de negócio
  const { stats, loading, error, recarregar } = useDashboard();

  // Extrair nome do usuário do email
  const userName = user?.email?.split("@")[0] || "Usuário";

  // Estados de loading e erro
  if (loading) {
    return (
      <S.Container>
        <S.LoadingContainer>
          <S.Spinner />
        </S.LoadingContainer>
      </S.Container>
    );
  }

  if (error) {
    return (
      <S.Container>
        <S.ErrorContainer>
          <p>{error}</p>
          <button onClick={recarregar}>Tentar Novamente</button>
        </S.ErrorContainer>
      </S.Container>
    );
  }

  return (
    <S.Container>
      {/* Welcome Banner (apenas desktop) */}
      <WelcomeBanner
        userName={userName}
        arenaName={arena?.nome}
        arenaSlug={arena?.slug}
      />

      {/* Cards de Estatísticas */}
      <S.Section>
        <h2>Visão Geral</h2>
        <StatsCards stats={stats} />
      </S.Section>

      {/* Ações Rápidas */}
      <S.Section>
        <h2>Ações Rápidas</h2>
        <QuickActions arenaSlug={arena?.slug} />
      </S.Section>

      {/* TOP 5 JOGADORES - Usando componente RankingList */}
      <S.Section>
        <RankingList
          arenaSlug={arena?.slug}
          limitPorNivel={10}
          showPagination={true}
          itensPorPagina={5}
        />
      </S.Section>

      {/* Rodapé */}
      <Footer />
    </S.Container>
  );
};

export default Dashboard;
