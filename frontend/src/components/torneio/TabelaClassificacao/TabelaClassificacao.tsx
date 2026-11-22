/**
 * Tabela de classificação do grupo, igual nos 4 formatos e na página pública
 *
 * Recebe o formato da etapa (cor do número da posição e dos pontos) e as
 * colunas a mostrar. Linhas e colunas vêm de `utils/classificacao`.
 */

import React from "react";
import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import { CoresFormato, getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import {
  ChaveColuna,
  COLUNAS_CLASSIFICACAO,
  formatarSaldo,
  LinhaClassificacao,
} from "@/utils/classificacao";

const { texto, superficie, status } = theme.semantic;

interface TabelaClassificacaoProps {
  formato?: FormatoEtapa;
  linhas: LinhaClassificacao[];
  colunas: ChaveColuna[];
  /** Cabeçalho da coluna do nome ("Dupla", "Jogador", "Equipe") */
  rotuloNome: string;
  /** Descrição da tabela para leitores de tela */
  legenda: string;
  /** false antes do primeiro jogo: mostra só posição e nome */
  mostrarEstatisticas?: boolean;
}

const somenteLeitor = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

// Âncora dos textos só para leitor de tela (posição absoluta)
const Wrapper = styled.div`
  position: relative;
`;

const Tabela = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${theme.typography.fontSize.sm};
  color: ${texto.principal};
`;

const Legenda = styled.caption`
  ${somenteLeitor}
`;

const SomenteLeitor = styled.span`
  ${somenteLeitor}
`;

const CelulaTitulo = styled.th<{ $esquerda?: boolean }>`
  padding: 0.5rem 0.25rem;
  background: ${superficie.fundoAlternativo};
  border-bottom: 1px solid ${superficie.borda};
  text-align: ${({ $esquerda }) => ($esquerda ? "left" : "center")};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${texto.secundario};
  white-space: nowrap;

  abbr {
    text-decoration: none;
  }

  ${({ $esquerda }) => $esquerda && "padding-left: 0.5rem;"}

  @media (min-width: 640px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  &:first-child {
    padding-left: 0.75rem;
  }

  &:last-child {
    padding-right: 0.75rem;
  }
`;

const Linha = styled.tr<{ $classificado: boolean }>`
  ${({ $classificado }) =>
    $classificado &&
    `box-shadow: inset 4px 0 0 ${status.sucesso.texto};`}

  & + & {
    border-top: 1px solid ${superficie.borda};
  }

  &:hover {
    background: ${superficie.fundoAlternativo};
  }
`;

const Celula = styled.td`
  padding: 0.75rem 0.25rem;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  @media (min-width: 640px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  &:first-child {
    padding-left: 0.75rem;
  }

  &:last-child {
    padding-right: 0.75rem;
  }
`;

// Ocupa o espaço que sobra; o nome quebra linha em vez de cortar
const CelulaNome = styled.th`
  width: 100%;
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: ${theme.typography.fontWeight.semibold};
  overflow-wrap: anywhere;
`;

const Posicao = styled.span<{ $cores: CoresFormato }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: ${({ $cores }) => $cores.suave};
  color: ${({ $cores }) => $cores.texto};
  font-weight: ${theme.typography.fontWeight.bold};
`;

const Detalhe = styled.span`
  display: block;
  margin-top: 0.125rem;
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.normal};
  color: ${texto.secundario};
`;

const Destaque = styled.span<{ $cores: CoresFormato }>`
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${({ $cores }) => $cores.texto};
`;

const LegendaClassificado = styled.p`
  margin: 0;
  padding: ${theme.spacing[2]} 0.75rem;
  border-top: 1px solid ${superficie.borda};
  font-size: ${theme.typography.fontSize.xs};
  color: ${texto.secundario};

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 0.875rem;
    margin-right: ${theme.spacing[2]};
    vertical-align: middle;
    background: ${status.sucesso.texto};
  }
`;

const corDoSaldo = (valor: number): string => {
  if (valor > 0) return status.sucesso.texto;
  if (valor < 0) return status.erro.texto;
  return texto.principal;
};

const Saldo = styled.span<{ $valor: number }>`
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${({ $valor }) => corDoSaldo($valor)};
`;

export const TabelaClassificacao: React.FC<TabelaClassificacaoProps> = ({
  formato,
  linhas,
  colunas,
  rotuloNome,
  legenda,
  mostrarEstatisticas = true,
}) => {
  const cores = getCoresFormato(formato);
  const colunasVisiveis = mostrarEstatisticas ? colunas : [];

  const renderValor = (linha: LinhaClassificacao, chave: ChaveColuna) => {
    const coluna = COLUNAS_CLASSIFICACAO[chave];
    const valor = coluna.valor(linha.estatisticas);

    if (coluna.saldo) {
      const saldo = Number(valor);
      return <Saldo $valor={saldo}>{formatarSaldo(saldo)}</Saldo>;
    }
    if (coluna.destaque) {
      return <Destaque $cores={cores}>{valor}</Destaque>;
    }
    return valor;
  };

  return (
    <Wrapper>
      <Tabela>
        <Legenda>{legenda}</Legenda>
        <thead>
          <tr>
            <CelulaTitulo scope="col">
              <abbr title="Posição">#</abbr>
            </CelulaTitulo>
            <CelulaTitulo scope="col" $esquerda>
              {rotuloNome}
            </CelulaTitulo>
            {colunasVisiveis.map((chave) => (
              <CelulaTitulo key={chave} scope="col">
                <abbr title={COLUNAS_CLASSIFICACAO[chave].descricao}>
                  {COLUNAS_CLASSIFICACAO[chave].sigla}
                </abbr>
              </CelulaTitulo>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <Linha key={linha.id} $classificado={!!linha.classificado}>
              <Celula>
                <Posicao $cores={cores}>{linha.posicao}</Posicao>
              </Celula>
              <CelulaNome scope="row">
                <span>{linha.nome}</span>
                {linha.classificado && (
                  <SomenteLeitor>(classificado)</SomenteLeitor>
                )}
                {linha.detalhe && <Detalhe>{linha.detalhe}</Detalhe>}
              </CelulaNome>
              {colunasVisiveis.map((chave) => (
                <Celula key={chave}>{renderValor(linha, chave)}</Celula>
              ))}
            </Linha>
          ))}
        </tbody>
      </Tabela>
      {linhas.some((linha) => linha.classificado) && (
        <LegendaClassificado>
          Classificado para a eliminatória
        </LegendaClassificado>
      )}
    </Wrapper>
  );
};

export default TabelaClassificacao;
