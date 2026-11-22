/**
 * Card de confronto/partida, igual nos formatos, na eliminatória e na página
 * pública: quem joga, placar de cada lado, vencedor e situação.
 */

import React from "react";
import styled from "styled-components";
import { Check } from "lucide-react";
import { theme } from "@/styles/theme";
import { Badge, BadgeTom } from "@/components/ui";

const { texto, superficie, status: coresStatus } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

export interface LadoConfronto {
  nome: string;
  /** Origem da vaga ou complemento ("1º Grupo A") */
  detalhe?: string;
  placar?: string | number;
  vencedor?: boolean;
}

interface CardConfrontoProps {
  /** Identificação ("Confronto 1", "Jogo 2") */
  titulo?: string;
  /** Selos extras ao lado do título (ex.: tipo de jogo) */
  etiquetas?: React.ReactNode;
  situacao?: { label: string; tom: BadgeTom };
  lado1: LadoConfronto;
  lado2: LadoConfronto;
  /** Partida dentro de um confronto: menor e sem o "VS" */
  compacto?: boolean;
  acoes?: React.ReactNode;
  /** Conteúdo abaixo do placar (partidas do confronto, avisos) */
  children?: React.ReactNode;
}

export const ListaConfrontos = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

/** Confrontos da eliminatória: até 2 colunas; sozinho (final), centralizado */
export const ConfrontosEliminatoria = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(max(min(100%, 22rem), calc(50% - ${theme.spacing[3]})), 1fr)
  );
  align-items: start;
  gap: ${theme.spacing[3]};

  > :only-child {
    justify-self: center;
    width: 100%;
    max-width: 34rem;
  }
`;

const Card = styled.article<{ $compacto: boolean }>`
  padding: ${({ $compacto }) =>
    $compacto ? theme.spacing[2] : theme.spacing[4]};
  background: ${superficie.fundo};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
`;

const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[2]};
`;

const Identificacao = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const Titulo = styled.span`
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.semibold};
  color: ${texto.secundario};
`;

const Lado = styled.div<{ $vencedor: boolean; $compacto: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  padding: ${({ $compacto }) =>
    $compacto
      ? `${theme.spacing[1]} ${theme.spacing[2]}`
      : `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $vencedor }) =>
    $vencedor ? coresStatus.sucesso.fundo : superficie.fundoAlternativo};
  color: ${({ $vencedor }) =>
    $vencedor ? coresStatus.sucesso.texto : texto.principal};
  font-size: ${fontSize.sm};
  font-weight: ${({ $vencedor }) =>
    $vencedor ? fontWeight.bold : fontWeight.medium};

  & + & {
    margin-top: ${theme.spacing[1]};
  }
`;

const Nome = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;

  svg {
    margin-left: ${theme.spacing[1]};
    vertical-align: middle;
  }
`;

const Detalhe = styled.div`
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.normal};
  color: ${texto.secundario};
`;

const Placar = styled.span<{ $compacto: boolean }>`
  flex-shrink: 0;
  font-size: ${({ $compacto }) => ($compacto ? fontSize.sm : fontSize.lg)};
  font-weight: ${fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

const Versus = styled.div`
  padding: ${theme.spacing[1]} 0;
  text-align: center;
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.semibold};
  color: ${texto.secundario};
`;

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  margin-top: ${theme.spacing[3]};
`;

const LinhaLado: React.FC<{ lado: LadoConfronto; compacto: boolean }> = ({
  lado,
  compacto,
}) => (
  <Lado $vencedor={!!lado.vencedor} $compacto={compacto}>
    <Nome>
      <span>{lado.nome}</span>
      {lado.vencedor && <Check size={16} role="img" aria-label="Vencedor" />}
      {lado.detalhe && <Detalhe>{lado.detalhe}</Detalhe>}
    </Nome>
    {lado.placar !== undefined && lado.placar !== "" && (
      <Placar $compacto={compacto}>{lado.placar}</Placar>
    )}
  </Lado>
);

export const CardConfronto: React.FC<CardConfrontoProps> = ({
  titulo,
  etiquetas,
  situacao,
  lado1,
  lado2,
  compacto = false,
  acoes,
  children,
}) => (
  <Card $compacto={compacto}>
    {(titulo || etiquetas || situacao) && (
      <Cabecalho>
        <Identificacao>
          {titulo && <Titulo>{titulo}</Titulo>}
          {etiquetas}
        </Identificacao>
        {situacao && <Badge tom={situacao.tom}>{situacao.label}</Badge>}
      </Cabecalho>
    )}

    <LinhaLado lado={lado1} compacto={compacto} />
    {!compacto && <Versus>VS</Versus>}
    <LinhaLado lado={lado2} compacto={compacto} />

    {acoes && <Acoes>{acoes}</Acoes>}
    {children}
  </Card>
);

export default CardConfronto;
