/**
 * Painel de um grupo (ou fase): cabeçalho na cor do formato, conteúdo e rodapé
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import { Badge } from "@/components/ui";

const { texto, superficie } = theme.semantic;

interface GrupoPainelProps {
  formato?: FormatoEtapa;
  nome: string;
  /** Resumos no cabeçalho ("4 duplas", "2/3 confrontos") */
  etiquetas?: string[];
  /** Progresso no rodapé ("4 / 6 partidas") */
  progresso?: string;
  completo?: boolean;
  /** Botão do rodapé */
  acao?: React.ReactNode;
  children: React.ReactNode;
}

/** 1 ou 2 colunas, conforme a largura que a tabela precisa (22rem) */
export const GruposGrid = styled.div`
  display: grid;
  gap: ${theme.spacing[6]};
  grid-template-columns: repeat(
    auto-fit,
    minmax(max(min(100%, 22rem), calc(50% - ${theme.spacing[6]})), 1fr)
  );
  align-items: start;
`;

const Painel = styled.section`
  overflow: hidden;
  background: ${superficie.fundo};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.base};
`;

const Cabecalho = styled.div<{ $fundo: string }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[4]};
  background: ${({ $fundo }) => $fundo};
`;

const Nome = styled.h3`
  margin: 0;
  color: ${texto.inverso};
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.bold};
`;

const Etiquetas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
`;

const Etiqueta = styled.span`
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.full};
  background: ${superficie.sobreposicaoEscura};
  color: ${texto.inverso};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
  background: ${superficie.fundoAlternativo};
  border-top: 1px solid ${superficie.borda};
`;

const Progresso = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${texto.secundario};
`;

export const GrupoPainel: React.FC<GrupoPainelProps> = ({
  formato,
  nome,
  etiquetas = [],
  progresso,
  completo = false,
  acao,
  children,
}) => (
  <Painel>
    <Cabecalho $fundo={getCoresFormato(formato).solido}>
      <Nome>{nome}</Nome>
      {etiquetas.length > 0 && (
        <Etiquetas>
          {etiquetas.map((etiqueta) => (
            <Etiqueta key={etiqueta}>{etiqueta}</Etiqueta>
          ))}
        </Etiquetas>
      )}
    </Cabecalho>

    {children}

    {(progresso || acao) && (
      <Rodape>
        {progresso && (
          <Progresso>
            <span>{progresso}</span>
            {completo && <Badge tom="sucesso">Completo</Badge>}
          </Progresso>
        )}
        {acao}
      </Rodape>
    )}
  </Painel>
);

export default GrupoPainel;
