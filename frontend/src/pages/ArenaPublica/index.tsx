/**
 * Responsabilidade única: Renderizar página pública da arena
 */

import React from "react";
import { useParams } from "react-router-dom";
import { EtapaCardList } from "@/components/arena/EtapaCardList";
import { RankingList } from "@/components/jogadores/RankingList";
import { Footer } from "@/components/layout/Footer";
import {
  CarregandoPublico,
  NaoEncontrado,
  PaginaPublica,
  SecaoTitulo,
} from "@/components/layout/PaginaPublica";
import { ButtonLink } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { useArenaPublica } from "@/hooks/useArenaPublica";
import * as S from "./ArenaPublica.styles";

const ArenaPublica: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { arena, etapas, loading, error } = useArenaPublica(slug);

  // Atualizar título da página
  useDocumentTitle(arena ? arena.nome : "Arena");

  if (loading) {
    return <CarregandoPublico mensagem="Carregando arena..." />;
  }

  if (error || !arena) {
    return (
      <NaoEncontrado
        titulo="Arena Não Encontrada"
        mensagem={error || "A arena que você está procurando não existe."}
        acao={<ButtonLink to="/">Voltar para o Início</ButtonLink>}
      />
    );
  }

  return (
    <PaginaPublica
      titulo={arena.nome}
      subtitulo="Torneios e Desafios"
      acao={
        <ButtonLink variant="outline" size="sm" to="/login">
          Área do Admin
        </ButtonLink>
      }
      rodape={<Footer />}
    >
      <S.BoasVindas>
        <h2>Bem-vindo à {arena.nome}!</h2>
        <p>
          Confira as etapas disponíveis e participe dos nossos torneios.
          Acompanhe os resultados e desafie outros jogadores!
        </p>
      </S.BoasVindas>

      <SecaoTitulo>Etapas e Torneios</SecaoTitulo>
      <EtapaCardList etapas={etapas} arenaSlug={slug || ""} />

      <SecaoTitulo>Ranking Completo</SecaoTitulo>
      <RankingList
        arenaSlug={slug}
        limitPorNivel={10}
        showPagination={true}
        itensPorPagina={5}
      />
    </PaginaPublica>
  );
};

export default ArenaPublica;
