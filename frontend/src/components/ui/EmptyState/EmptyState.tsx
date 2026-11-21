/**
 * Estado vazio (lista sem itens, chaves não geradas, etc.)
 *
 * Mensagem centralizada com ícone, descrição e ação opcionais.
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";

interface EmptyStateProps {
  titulo: string;
  descricao?: React.ReactNode;
  icone?: React.ReactNode;
  /** Ação principal (ex.: um <Button>) */
  acao?: React.ReactNode;
  className?: string;
}

const { texto } = theme.semantic;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[12]} ${theme.spacing[4]};
  text-align: center;
  font-family: ${theme.typography.fontFamily.sans};
`;

const Icone = styled.div`
  color: ${texto.secundario};
  display: flex;

  svg {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const Titulo = styled.p`
  margin: 0;
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${texto.principal};
`;

const Descricao = styled.div`
  margin: 0;
  max-width: 28rem;
  font-size: ${theme.typography.fontSize.sm};
  line-height: ${theme.typography.lineHeight.relaxed};
  color: ${texto.secundario};
`;

const Acao = styled.div`
  margin-top: ${theme.spacing[2]};
`;

export const EmptyState: React.FC<EmptyStateProps> = ({
  titulo,
  descricao,
  icone,
  acao,
  className,
}) => (
  <Container className={className}>
    {icone && <Icone aria-hidden="true">{icone}</Icone>}
    <Titulo>{titulo}</Titulo>
    {descricao && <Descricao>{descricao}</Descricao>}
    {acao && <Acao>{acao}</Acao>}
  </Container>
);

export default EmptyState;
