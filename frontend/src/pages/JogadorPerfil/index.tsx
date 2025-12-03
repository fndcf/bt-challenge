/**
 * JogadorPerfil/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da página de perfil do jogador
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - ISP: Interfaces específicas para cada componente
 * - DIP: Componentes dependem de abstrações (props), não de implementações
 */

import React from "react";
import { useParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks";
import { Footer } from "@/components/layout/Footer";
import { useJogadorPerfil } from "./hooks/useJogadorPerfil";
import { PageHeader } from "./components/PageHeader";
import { ProfileHeader } from "./components/ProfileHeader";
import { StatsGrid } from "./components/StatsGrid";
import { HistoricoCard } from "./components/HistoricoCard";
import * as S from "./JogadorPerfil.styles";

export const JogadorPerfil: React.FC = () => {
  const { slug, jogadorId } = useParams<{ slug: string; jogadorId: string }>();

  // Hook centralizado com toda a lógica de negócio
  const {
    loading,
    error,
    arena,
    jogador,
    historico,
    nomeJogador,
    nivelJogador,
    generoJogador,
    totalEtapas,
    totalVitorias,
    totalDerrotas,
    posicaoAtual,
    getInitials,
  } = useJogadorPerfil(slug, jogadorId);

  // Atualizar título da página
  useDocumentTitle(
    jogador ? `${nomeJogador} - ${arena?.nome}` : "Perfil do Jogador"
  );

  // Loading
  if (loading) {
    return (
      <S.PageContainer>
        <S.LoadingContainer>
          <S.Spinner />
          <S.LoadingText>Carregando perfil...</S.LoadingText>
        </S.LoadingContainer>
      </S.PageContainer>
    );
  }

  // Error / Not Found
  if (error || !arena || !jogador) {
    return (
      <S.PageContainer>
        <S.Container>
          <S.ErrorCard>
            <S.ErrorIcon>❌</S.ErrorIcon>
            <S.ErrorTitle>Jogador Não Encontrado</S.ErrorTitle>
            <S.ErrorText>
              {error || "O jogador que você está procurando não existe."}
            </S.ErrorText>
            <S.ErrorButton onClick={() => window.history.back()}>
              Voltar
            </S.ErrorButton>
          </S.ErrorCard>
        </S.Container>
      </S.PageContainer>
    );
  }

  return (
    <S.PageContainer>
      {/* Header com Breadcrumb */}
      <PageHeader
        arenaSlug={slug!}
        arenaNome={arena.nome}
        jogadorNome={nomeJogador}
      />

      <S.Container>
        {/* Cabeçalho do Perfil */}
        <ProfileHeader
          nomeJogador={nomeJogador}
          arenaNome={arena.nome}
          nivelJogador={nivelJogador}
          generoJogador={generoJogador}
          posicaoAtual={posicaoAtual}
          getInitials={getInitials}
        />

        {/* Grid de Estatísticas */}
        <S.Grid>
          <StatsGrid
            totalVitorias={totalVitorias}
            totalDerrotas={totalDerrotas}
            totalEtapas={totalEtapas}
          />

          {/* Histórico de Participações */}
          <HistoricoCard historico={historico} slug={slug!} />
        </S.Grid>
      </S.Container>

      {/* Rodapé */}
      <Footer />
    </S.PageContainer>
  );
};

export default JogadorPerfil;
