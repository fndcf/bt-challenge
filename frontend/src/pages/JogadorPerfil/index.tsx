/**
 * Responsabilidade única: Orquestrar componentes da página de perfil do jogador
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import {
  CarregandoPublico,
  NaoEncontrado,
  PaginaPublica,
} from "@/components/layout/PaginaPublica";
import { Button } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { HistoricoCard } from "./components/HistoricoCard";
import { ProfileHeader } from "./components/ProfileHeader";
import { StatsGrid } from "./components/StatsGrid";
import { useJogadorPerfil } from "./hooks/useJogadorPerfil";

export const JogadorPerfil: React.FC = () => {
  const { slug, jogadorId } = useParams<{ slug: string; jogadorId: string }>();
  const navigate = useNavigate();

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
    totalGamesVencidos,
    totalGamesPerdidos,
    posicaoAtual,
    getInitials,
  } = useJogadorPerfil(slug, jogadorId);

  // Atualizar título da página
  useDocumentTitle(
    jogador ? `${nomeJogador} - ${arena?.nome}` : "Perfil do Jogador"
  );

  if (loading) {
    return <CarregandoPublico mensagem="Carregando perfil..." />;
  }

  if (error || !arena || !jogador) {
    return (
      <NaoEncontrado
        titulo="Jogador Não Encontrado"
        mensagem={error || "O jogador que você está procurando não existe."}
        acao={<Button onClick={() => window.history.back()}>Voltar</Button>}
      />
    );
  }

  return (
    <PaginaPublica
      titulo="Perfil do Jogador"
      trilha={{
        arenaSlug: slug!,
        arenaNome: arena.nome,
        atual: nomeJogador,
      }}
      acao={
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          ← Voltar
        </Button>
      }
      rodape={<Footer />}
    >
      <ProfileHeader
        nomeJogador={nomeJogador}
        arenaNome={arena.nome}
        nivelJogador={nivelJogador}
        generoJogador={generoJogador}
        getInitials={getInitials}
      />

      <StatsGrid
        posicaoAtual={posicaoAtual}
        totalVitorias={totalVitorias}
        totalDerrotas={totalDerrotas}
        totalEtapas={totalEtapas}
        totalGamesVencidos={totalGamesVencidos}
        totalGamesPerdidos={totalGamesPerdidos}
      />

      <HistoricoCard historico={historico} slug={slug!} />
    </PaginaPublica>
  );
};

export default JogadorPerfil;
