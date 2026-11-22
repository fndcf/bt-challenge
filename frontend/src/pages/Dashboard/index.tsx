/**
 * Responsabilidade única: Orquestrar componentes da página Dashboard
 */

import React from "react";
import { RankingList } from "@/components/jogadores/RankingList";
import { Footer } from "@/components/layout/Footer";
import { CarregandoPagina, Pagina } from "@/components/layout/Pagina";
import { Alert, Button } from "@/components/ui";
import { useArena } from "@/contexts/ArenaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks";
import { QuickActions } from "./components/QuickActions";
import { StatsCards } from "./components/StatsCards";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { useDashboard } from "./hooks/useDashboard";
import * as S from "./Dashboard.styles";

export const Dashboard: React.FC = () => {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { arena } = useArena();
  const { stats, loading, error, recarregar } = useDashboard();

  // Extrair nome do usuário do email
  const userName = user?.email?.split("@")[0] || "Usuário";

  if (loading) {
    return <CarregandoPagina mensagem="Carregando dashboard..." />;
  }

  if (error) {
    return (
      <Pagina>
        <Alert variant="error">{error}</Alert>
        <div>
          <Button onClick={recarregar}>Tentar Novamente</Button>
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina>
      <WelcomeBanner
        userName={userName}
        arenaName={arena?.nome}
        arenaSlug={arena?.slug}
      />

      <S.Secao>
        <S.SecaoTitulo>Visão Geral</S.SecaoTitulo>
        <StatsCards stats={stats} />
      </S.Secao>

      <S.Secao>
        <S.SecaoTitulo>Ações Rápidas</S.SecaoTitulo>
        <QuickActions arenaSlug={arena?.slug} />
      </S.Secao>

      <RankingList
        arenaSlug={arena?.slug}
        limitPorNivel={10}
        showPagination={true}
        itensPorPagina={5}
      />

      <Footer />
    </Pagina>
  );
};

export default Dashboard;
