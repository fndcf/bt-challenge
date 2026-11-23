/**
 * Página de erro (404, 403) com a mesma moldura das telas de acesso
 */

import React from "react";
import styled from "styled-components";
import { Home } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { media, theme } from "@/styles/theme";
import { FundoAcesso, MarcaAcesso } from "./PaginaAcesso";

const { texto, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Conteudo = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 32rem;
  text-align: center;
`;

const Icone = styled.span`
  display: flex;
  color: ${acao.primaria};
  margin-bottom: ${theme.spacing[2]};
`;

const Codigo = styled.p`
  margin: 0;
  font-size: 6rem;
  font-weight: ${fontWeight.extrabold};
  line-height: 1;
  letter-spacing: -0.04em;
  color: ${acao.primaria};

  ${media.sm} {
    font-size: 8rem;
  }
`;

const Titulo = styled.h1`
  margin: ${theme.spacing[4]} 0 ${theme.spacing[2]};
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Descricao = styled.p`
  margin: 0 0 ${theme.spacing[8]};
  line-height: 1.6;
  color: ${texto.secundario};
`;

interface PaginaErroProps {
  codigo: string;
  titulo: string;
  descricao: string;
  icone?: React.ReactNode;
}

export const PaginaErro: React.FC<PaginaErroProps> = ({
  codigo,
  titulo,
  descricao,
  icone,
}) => (
  <FundoAcesso>
    <MarcaAcesso to="/">Dupley</MarcaAcesso>
    <Conteudo>
      {icone && <Icone aria-hidden="true">{icone}</Icone>}
      <Codigo>{codigo}</Codigo>
      <Titulo>{titulo}</Titulo>
      <Descricao>{descricao}</Descricao>
      <ButtonLink to="/" size="lg">
        <Home size={20} aria-hidden="true" />
        Voltar para o Início
      </ButtonLink>
    </Conteudo>
  </FundoAcesso>
);
