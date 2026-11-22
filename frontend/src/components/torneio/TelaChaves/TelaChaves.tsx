/**
 * Estrutura comum das telas de chaves dos 4 formatos: moldura, cabeçalho,
 * estados (carregando, erro, vazio) e linha de ações
 */

import React from "react";
import styled from "styled-components";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";

const { texto } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

export const TelaChaves = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
  max-width: 1400px;
  margin: 0 auto;
  padding: ${theme.spacing[4]};

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[6]};
  }
`;

export const AcoesChaves = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${theme.spacing[3]};
`;

const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
`;

const Titulo = styled.h2`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
  margin: 0;
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Resumo = styled.div`
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Centralizado = styled.div`
  padding: ${theme.spacing[16]} 0;
`;

interface CabecalhoChavesProps {
  titulo: string;
  /** Selo do formato ao lado do título (ex.: "Grupo Único") */
  selo?: string;
  formato: FormatoEtapa;
  resumo: string;
}

export const CabecalhoChaves: React.FC<CabecalhoChavesProps> = ({
  titulo,
  selo,
  formato,
  resumo,
}) => (
  <Cabecalho>
    <Titulo>
      {titulo}
      {selo && <Badge formato={formato}>{selo}</Badge>}
    </Titulo>
    <Resumo>{resumo}</Resumo>
  </Cabecalho>
);

interface EstadoChavesProps {
  carregando: boolean;
  erro: string | null;
  /** Mensagem de quando ainda não há chaves */
  vazio: string;
}

/** Mostrado no lugar da tela enquanto não há o que exibir */
export const EstadoChaves: React.FC<EstadoChavesProps> = ({
  carregando,
  erro,
  vazio,
}) => {
  if (carregando) {
    return (
      <Centralizado>
        <LoadingSpinner message="Carregando chaves..." />
      </Centralizado>
    );
  }

  return (
    <TelaChaves>
      {erro ? (
        <Alert variant="error">
          <strong>Erro:</strong> {erro}
        </Alert>
      ) : (
        <EmptyState titulo={vazio} />
      )}
    </TelaChaves>
  );
};
