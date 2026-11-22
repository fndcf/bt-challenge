/**
 * Moldura das telas de acesso (login, cadastro, recuperar senha)
 */

import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Fundo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  padding: ${theme.spacing[6]} ${theme.spacing[4]};
  background: ${theme.gradients.primary};
`;

const Cartao = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
  box-sizing: border-box;
  width: 100%;
  max-width: 32rem;
  padding: ${theme.spacing[8]};
  border-radius: ${theme.borderRadius.xl};
  background: ${superficie.fundo};
  box-shadow: ${theme.shadows.xl};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[6]} ${theme.spacing[4]};
  }
`;

const Cabecalho = styled.header`
  text-align: center;

  h1 {
    margin: 0 0 ${theme.spacing[2]} 0;
    font-size: ${fontSize["3xl"]};
    font-weight: ${fontWeight.bold};
    color: ${texto.principal};
  }

  p {
    margin: 0;
    color: ${texto.secundario};
  }
`;

/** Textos e links centralizados ao pé do cartão */
export const RodapeAcesso = styled.div`
  text-align: center;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};

  p {
    margin: 0;
  }
`;

export const LinkAcesso = styled(Link)`
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${acao.primaria};
  text-decoration: underline;
`;

interface PaginaAcessoProps {
  titulo: string;
  subtitulo: string;
  /** Link ao pé do cartão (ex.: voltar para o site) */
  voltar?: { para: string; rotulo: string };
  children: React.ReactNode;
}

export const PaginaAcesso: React.FC<PaginaAcessoProps> = ({
  titulo,
  subtitulo,
  voltar,
  children,
}) => (
  <Fundo>
    <Cartao>
      <Cabecalho>
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
      </Cabecalho>
      {children}
      {voltar && (
        <RodapeAcesso>
          <LinkAcesso to={voltar.para}>{voltar.rotulo}</LinkAcesso>
        </RodapeAcesso>
      )}
    </Cartao>
  </Fundo>
);
