/**
 * Responsabilidade única: Orquestrar componentes da página de detalhes da etapa
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks";
import { useEtapaDetalhe } from "./hooks/useEtapaDetalhe";
import { EtapaHeader } from "./components/EtapaHeader";
import { EtapaInfo } from "./components/EtapaInfo";
import { JogadoresList } from "./components/JogadoresList";
import { BracketViewer } from "@/components/visualizadores/BracketViewer";
import { GruposViewer } from "@/components/visualizadores/GruposViewer";
import * as S from "./EtapaDetalhe.styles";
import { Footer } from "@/components/layout/Footer";

export const EtapaDetalhe: React.FC = () => {
  const { slug, etapaId } = useParams<{ slug: string; etapaId: string }>();
  const navigate = useNavigate();

  const { arena, etapa, jogadores, chaves, grupos, loading, error } =
    useEtapaDetalhe(slug, etapaId);

  // Atualizar título da página
  useDocumentTitle(
    etapa && arena ? `${etapa.nome} - ${arena.nome}` : "Detalhes da Etapa"
  );

  // Loading state
  if (loading) {
    return (
      <S.Page>
        <S.Loading>
          <S.Spinner />
          <S.LoadingText>Carregando...</S.LoadingText>
        </S.Loading>
      </S.Page>
    );
  }

  // Error state
  if (error || !arena || !etapa) {
    return (
      <S.Page>
        <S.Container>
          <S.ErrorCard>
            <S.ErrorIcon>❌</S.ErrorIcon>
            <S.ErrorTitle>Etapa Não Encontrada</S.ErrorTitle>
            <S.ErrorText>
              {error || "A etapa que você está procurando não existe."}
            </S.ErrorText>
            <S.ErrorBtn to={slug ? `/arena/${slug}` : "/"}>
              Voltar para Arena
            </S.ErrorBtn>
          </S.ErrorCard>
        </S.Container>
      </S.Page>
    );
  }

  // Verificar se é formato TEAMS (não mostra BracketViewer)
  const isTeams = etapa.formato === "teams";

  return (
    <S.Page>
      {/* Header */}
      <EtapaHeader
        slug={slug || ""}
        arenaName={arena.nome}
        etapa={etapa}
        onBack={() => navigate(-1)}
      />

      {/* Content */}
      <S.Container>
        <S.Layout>
          {/* Main */}
          <S.Main>
            {/* Informações da Etapa */}
            <EtapaInfo etapa={etapa} totalJogadores={jogadores.length} />

            {/* Jogadores Inscritos */}
            <JogadoresList slug={slug || ""} jogadores={jogadores} />

            {/* Grupos (se existirem) */}
            {grupos?.length > 0 && <GruposViewer grupos={grupos} />}

            {/* Chaves (se existirem) - NÃO mostrar para TEAMS */}
            {chaves && !isTeams && <BracketViewer chaves={chaves} />}
          </S.Main>
        </S.Layout>
      </S.Container>
      <Footer />
    </S.Page>
  );
};

export default EtapaDetalhe;
