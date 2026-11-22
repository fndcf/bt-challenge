import styled from "styled-components";
import { theme } from "@/styles/theme";

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

export const Pagina = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
  max-width: 72rem;
  margin: 0 auto;
  padding: ${theme.spacing[8]} ${theme.spacing[4]};

  @media (min-width: ${theme.breakpoints.lg}) {
    padding: ${theme.spacing[8]};
  }
`;

export const Centralizado = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

export const Abas = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

export const RotuloAba = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

export const Cartao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
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
