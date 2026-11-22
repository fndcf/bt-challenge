/**
 * Seção das páginas públicas: cartão branco com título, selo e ação
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface SecaoPublicaProps {
  titulo: string;
  descricao?: string;
  /** Selo ao lado do título (formato, gênero) */
  selo?: React.ReactNode;
  acao?: React.ReactNode;
  children: React.ReactNode;
}

const Secao = styled.section`
  padding: ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.xl};
  background: ${superficie.fundo};
  box-shadow: ${theme.shadows.sm};

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[6]};
  }
`;

const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  margin-bottom: ${theme.spacing[6]};
`;

const Titulo = styled.h2`
  margin: 0;
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const LinhaTitulo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const Descricao = styled.p`
  margin: ${theme.spacing[1]} 0 0 0;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

export const SecaoPublica: React.FC<SecaoPublicaProps> = ({
  titulo,
  descricao,
  selo,
  acao,
  children,
}) => (
  <Secao>
    <Cabecalho>
      <div>
        <LinhaTitulo>
          <Titulo>{titulo}</Titulo>
          {selo}
        </LinhaTitulo>
        {descricao && <Descricao>{descricao}</Descricao>}
      </div>
      {acao}
    </Cabecalho>
    {children}
  </Secao>
);

export default SecaoPublica;
