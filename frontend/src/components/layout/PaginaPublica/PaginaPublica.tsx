/**
 * Estrutura comum das páginas públicas: fundo, topo fixo, conteúdo e estados
 * (carregando, não encontrado)
 */

import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { CarregandoPagina } from "../Pagina";
import { EmptyState } from "@/components/ui";
import { theme } from "@/styles/theme";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Fundo = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: ${superficie.pagina};
`;

const Topo = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid ${superficie.borda};
  background: ${superficie.fundo};
`;

const TopoInterno = styled.div`
  max-width: 75rem;
  margin: 0 auto;
  padding: ${theme.spacing[3]} ${theme.spacing[4]};

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[3]} ${theme.spacing[6]};
  }
`;

const LinhaTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};

  > :last-child {
    flex-shrink: 0;
  }
`;

const LinhaTitulo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[1]} ${theme.spacing[3]};
  min-width: 0;
`;

const Titulo = styled.h1`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Subtitulo = styled.p`
  margin: 0;
  width: 100%;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Trilha = styled.nav`
  display: flex;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[1]};
  overflow-x: auto;
  white-space: nowrap;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};

  a {
    color: ${acao.primaria};
    text-decoration: underline;
  }
`;

const Conteudo = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
  box-sizing: border-box;
  max-width: 75rem;
  margin: 0 auto;
  padding: ${theme.spacing[6]} ${theme.spacing[4]};

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[8]} ${theme.spacing[6]};
  }
`;

interface PaginaPublicaProps {
  titulo: string;
  subtitulo?: string;
  selos?: React.ReactNode;
  acao?: React.ReactNode;
  /** Caminho até a página: arena e página atual */
  trilha?: { arenaSlug: string; arenaNome: string; atual: string };
  rodape?: React.ReactNode;
  children: React.ReactNode;
}

export const PaginaPublica: React.FC<PaginaPublicaProps> = ({
  titulo,
  subtitulo,
  selos,
  acao: acaoTopo,
  trilha,
  rodape,
  children,
}) => (
  <Fundo>
    <Topo>
      <TopoInterno>
        {trilha && (
          <Trilha aria-label="Caminho">
            <Link to={`/arena/${trilha.arenaSlug}`}>{trilha.arenaNome}</Link>
            <span aria-hidden="true">›</span>
            <span>{trilha.atual}</span>
          </Trilha>
        )}
        <LinhaTopo>
          <LinhaTitulo>
            <Titulo>{titulo}</Titulo>
            {selos}
            {subtitulo && <Subtitulo>{subtitulo}</Subtitulo>}
          </LinhaTitulo>
          {acaoTopo}
        </LinhaTopo>
      </TopoInterno>
    </Topo>
    <Conteudo>{children}</Conteudo>
    {rodape}
  </Fundo>
);

export const CarregandoPublico: React.FC<{ mensagem: string }> = ({
  mensagem,
}) => (
  <Fundo>
    <CarregandoPagina mensagem={mensagem} />
  </Fundo>
);

interface NaoEncontradoProps {
  titulo: string;
  mensagem: string;
  acao: React.ReactNode;
}

export const NaoEncontrado: React.FC<NaoEncontradoProps> = ({
  titulo,
  mensagem,
  acao: acaoVoltar,
}) => (
  <Fundo>
    <Conteudo>
      <EmptyState titulo={titulo} descricao={mensagem} acao={acaoVoltar} />
    </Conteudo>
  </Fundo>
);

export const SecaoTitulo = styled.h2`
  margin: 0;
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;
