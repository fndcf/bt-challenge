import styled from "styled-components";
import { theme } from "@/styles/theme";

const { texto, acao } = theme.semantic;

export const BoasVindas = styled.section`
  padding: ${theme.spacing[8]};
  border-radius: ${theme.borderRadius.xl};
  background: ${acao.primaria};
  color: ${texto.inverso};

  h2 {
    margin: 0 0 ${theme.spacing[2]} 0;
    font-size: ${theme.typography.fontSize["2xl"]};
  }

  p {
    margin: 0;
    line-height: 1.6;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[6]} ${theme.spacing[4]};
  }
`;
