/**
 * Estrutura comum das páginas do admin: moldura, cabeçalho, cartões, números
 * e formulários
 */

import React from "react";
import styled, { css } from "styled-components";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";
import { Button } from "@/components/ui";
import { theme } from "@/styles/theme";

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

// ============== MOLDURA ==============

export const Pagina = styled.div<{ $estreita?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
  box-sizing: border-box;
  max-width: ${({ $estreita }) => ($estreita ? "56rem" : "75rem")};
  margin: 0 auto;
  padding: ${theme.spacing[6]} ${theme.spacing[4]};

  @media (min-width: ${theme.breakpoints.lg}) {
    padding: ${theme.spacing[8]};
  }
`;

const Centralizado = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
`;

export const CarregandoPagina: React.FC<{ mensagem: string }> = ({
  mensagem,
}) => (
  <Centralizado>
    <LoadingSpinner message={mensagem} />
  </Centralizado>
);

// ============== CABEÇALHO ==============

const Cabecalho = styled.header`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.spacing[3]};
`;

const LinhaCabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing[4]};
  width: 100%;
`;

const LinhaTitulo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]} ${theme.spacing[3]};
`;

const Titulo = styled.h1`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Subtitulo = styled.p`
  margin: ${theme.spacing[1]} 0 0 0;
  color: ${texto.secundario};
`;

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[3]};
`;

interface CabecalhoPaginaProps {
  titulo: string;
  subtitulo?: React.ReactNode;
  /** Selos ao lado do título (status, formato) */
  selos?: React.ReactNode;
  acoes?: React.ReactNode;
  voltar?: { rotulo?: string; onClick: () => void };
}

export const CabecalhoPagina: React.FC<CabecalhoPaginaProps> = ({
  titulo,
  subtitulo,
  selos,
  acoes,
  voltar,
}) => (
  <Cabecalho>
    {voltar && (
      <Button variant="ghost" size="sm" onClick={voltar.onClick}>
        {voltar.rotulo ?? "← Voltar"}
      </Button>
    )}
    <LinhaCabecalho>
      <div>
        <LinhaTitulo>
          <Titulo>{titulo}</Titulo>
          {selos}
        </LinhaTitulo>
        {subtitulo && <Subtitulo>{subtitulo}</Subtitulo>}
      </div>
      {acoes && <Acoes>{acoes}</Acoes>}
    </LinhaCabecalho>
  </Cabecalho>
);

// ============== CARTÕES ==============

export const Cartao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  box-sizing: border-box;
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

export const CartaoTitulo = styled.h2`
  margin: 0;
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

export const Texto = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  line-height: 1.5;
  color: ${texto.secundario};
`;

/** Cartões em colunas que se ajustam à largura; `$minimo` é a menor coluna */
export const Grade = styled.div<{ $minimo?: string; $preencher?: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $preencher }) => ($preencher ? "auto-fill" : "auto-fit")},
    minmax(min(100%, ${({ $minimo = "18rem" }) => $minimo}), 1fr)
  );
  gap: ${theme.spacing[4]};
`;

// ============== NÚMEROS ==============

const CartaoDoNumero = styled.div`
  padding: ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
`;

export const Rotulo = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

export const Numero = styled.p`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

interface CartaoNumeroProps {
  rotulo: string;
  valor: React.ReactNode;
}

export const CartaoNumero: React.FC<CartaoNumeroProps> = ({
  rotulo,
  valor,
}) => (
  <CartaoDoNumero>
    <Rotulo>{rotulo}</Rotulo>
    <Numero>{valor}</Numero>
  </CartaoDoNumero>
);

// ============== FORMULÁRIO ==============

export const Formulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

export const Campos = styled.div<{ $colunas?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};

  ${({ $colunas }) =>
    $colunas &&
    css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      align-items: start;
    `}
`;

export const AcoesFormulario = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${theme.spacing[3]};

  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column-reverse;
  }
`;
