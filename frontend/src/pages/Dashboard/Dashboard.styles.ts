import { Link } from "react-router-dom";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

export const SecaoTitulo = styled.h2`
  margin: 0;
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

// ============== BOAS-VINDAS (só no desktop) ==============

export const WelcomeBanner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing[8]};
  padding: ${theme.spacing[8]};
  border-radius: ${theme.borderRadius.lg};
  background: ${acao.primaria};
  color: ${texto.inverso};

  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

export const WelcomeText = styled.div`
  h1 {
    margin: 0 0 ${theme.spacing[2]} 0;
    font-size: ${fontSize["2xl"]};
  }

  p {
    margin: 0;
  }
`;

export const ArenaBadge = styled.div`
  padding: ${theme.spacing[4]} ${theme.spacing[6]};
  border-radius: ${theme.borderRadius.md};
  background: ${superficie.sobreposicaoEscura};

  p {
    margin: 0;
    font-weight: ${fontWeight.semibold};
  }

  small {
    font-size: ${fontSize.sm};
  }
`;

// ============== AÇÕES RÁPIDAS ==============

export const ActionCard = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  color: ${acao.primaria};
  text-decoration: none;

  &:hover {
    border-color: ${acao.primaria};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 2px;
  }

  h3 {
    margin: 0 0 ${theme.spacing[1]} 0;
    font-size: ${fontSize.base};
    font-weight: ${fontWeight.semibold};
    color: ${texto.principal};
  }

  p {
    margin: 0;
    font-size: ${fontSize.sm};
    color: ${texto.secundario};
  }
`;
