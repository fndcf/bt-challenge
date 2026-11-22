/**
 * Responsabilidade única: Orquestrar componentes da página de detalhes da etapa
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/etapas/StatusBadge";
import { Footer } from "@/components/layout/Footer";
import {
  CarregandoPublico,
  NaoEncontrado,
  PaginaPublica,
} from "@/components/layout/PaginaPublica";
import { Button, ButtonLink } from "@/components/ui";
import { BracketViewer } from "@/components/visualizadores/BracketViewer";
import { GruposViewer } from "@/components/visualizadores/GruposViewer";
import { useDocumentTitle } from "@/hooks";
import { EtapaInfo } from "./components/EtapaInfo";
import { JogadoresList } from "./components/JogadoresList";
import { useEtapaDetalhe } from "./hooks/useEtapaDetalhe";

export const EtapaDetalhe: React.FC = () => {
  const { slug, etapaId } = useParams<{ slug: string; etapaId: string }>();
  const navigate = useNavigate();

  const { arena, etapa, jogadores, chaves, grupos, loading, error } =
    useEtapaDetalhe(slug, etapaId);

  // Atualizar título da página
  useDocumentTitle(
    etapa && arena ? `${etapa.nome} - ${arena.nome}` : "Detalhes da Etapa"
  );

  if (loading) {
    return <CarregandoPublico mensagem="Carregando..." />;
  }

  if (error || !arena || !etapa) {
    return (
      <NaoEncontrado
        titulo="Etapa Não Encontrada"
        mensagem={error || "A etapa que você está procurando não existe."}
        acao={
          <ButtonLink to={slug ? `/arena/${slug}` : "/"}>
            Voltar para Arena
          </ButtonLink>
        }
      />
    );
  }

  // TEAMS não mostra a chave: os confrontos já aparecem nos grupos
  const isTeams = etapa.formato === "teams";

  return (
    <PaginaPublica
      titulo={etapa.nome}
      selos={<StatusBadge status={etapa.status} />}
      trilha={{
        arenaSlug: slug || "",
        arenaNome: arena.nome,
        atual: etapa.nome,
      }}
      acao={
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          ← Voltar
        </Button>
      }
      rodape={<Footer />}
    >
      <EtapaInfo etapa={etapa} totalJogadores={jogadores.length} />
      <JogadoresList slug={slug || ""} jogadores={jogadores} />
      {grupos?.length > 0 && <GruposViewer grupos={grupos} />}
      {chaves && !isTeams && <BracketViewer chaves={chaves} />}
    </PaginaPublica>
  );
};

export default EtapaDetalhe;
