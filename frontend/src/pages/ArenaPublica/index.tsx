/**
 * Responsabilidade única: Renderizar página pública da arena
 */

import React from "react";
import { useParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks";
import { useArenaPublica } from "@/hooks/useArenaPublica";
import { EtapaCardList } from "@/components/arena/EtapaCardList";
import { RankingList } from "@/components/jogadores/RankingList";
import { Footer } from "@/components/layout/Footer";
import * as S from "./ArenaPublica.styles";

const ArenaPublica: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { arena, etapas, loading, error } = useArenaPublica(slug);

  // Atualizar título da página
  useDocumentTitle(arena ? arena.nome : "Arena");

  // Estados de loading e erro
  if (loading) {
    return (
      <S.PageContainer>
        <S.LoadingContainer>
          <S.Spinner />
          <S.LoadingText>Carregando arena...</S.LoadingText>
        </S.LoadingContainer>
      </S.PageContainer>
    );
  }

  if (error || !arena) {
    return (
      <S.PageContainer>
        <S.Container>
          <S.ErrorContainer>
            <S.ErrorIcon>❌</S.ErrorIcon>
            <S.ErrorTitle>Arena Não Encontrada</S.ErrorTitle>
            <S.ErrorText>
              {error || "A arena que você está procurando não existe."}
            </S.ErrorText>
            <S.BackButton to="/">Voltar para o Início</S.BackButton>
          </S.ErrorContainer>
        </S.Container>
      </S.PageContainer>
    );
  }

  // Renderização principal
  return (
    <S.PageContainer>
      {/* Header */}
      <S.Header>
        <S.HeaderContent>
          <S.ArenaInfo>
            <h1>{arena.nome}</h1>
            <p>Torneios e Desafios </p>
          </S.ArenaInfo>
          <S.LoginButton to="/login">Área do Admin</S.LoginButton>
        </S.HeaderContent>
      </S.Header>

      {/* Conteúdo */}
      <S.Container>
        {/* Card de Boas-vindas */}
        <S.WelcomeCard>
          <S.WelcomeTitle>Bem-vindo à {arena.nome}!</S.WelcomeTitle>
          <S.WelcomeText>
            Confira as etapas disponíveis e participe dos nossos torneios.
            Acompanhe os resultados e desafie outros jogadores!
          </S.WelcomeText>
        </S.WelcomeCard>

        {/* Seção de Etapas */}
        <S.SectionTitle>Etapas e Torneios</S.SectionTitle>
        <EtapaCardList etapas={etapas} arenaSlug={slug || ""} />

        {/* Seção de Ranking */}
        <S.SectionTitle>Ranking Completo</S.SectionTitle>
        <RankingList
          arenaSlug={slug}
          limitPorNivel={10}
          showPagination={true}
          itensPorPagina={5}
        />
      </S.Container>

      {/* Footer */}
      <Footer />
    </S.PageContainer>
  );
};

export default ArenaPublica;
