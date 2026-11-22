import styled from "styled-components";
import { theme } from "@/styles/theme";

const { texto, superficie, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

// ============== ANTES DE GERAR ==============

export const EstadoInicial = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[4]};
  box-sizing: border-box;
  width: 100%;
  max-width: 42rem;
  margin: 0 auto;
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  text-align: center;

  > div {
    align-self: stretch;
    text-align: left;
  }

  > p {
    margin: 0;
    color: ${texto.secundario};
  }
`;

export const EstadoTitulo = styled.h3`
  margin: 0;
  font-size: ${fontSize.xl};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

export const Dica = styled.p`
  font-size: ${fontSize.sm};
`;

// ============== FASES ==============

export const FaseCard = styled.section`
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

export const FaseHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[4]};
  padding-bottom: ${theme.spacing[4]};
  border-bottom: 1px solid ${superficie.borda};
`;

export const FaseTitle = styled.h3`
  margin: 0;
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

export const FaseStatus = styled.span`
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.secundario};
`;

export const ByeBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Acompanha a altura do confronto ao lado */
  align-self: stretch;
  padding: ${theme.spacing[6]};
  border: 1px solid ${status.sucesso.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${status.sucesso.fundo};
  color: ${status.sucesso.texto};
  text-align: center;
`;

export const ByeTeam = styled.div`
  font-weight: ${fontWeight.bold};
`;

export const ByeOrigin = styled.div`
  margin-top: ${theme.spacing[1]};
  font-size: ${fontSize.xs};
`;

export const ByeLabel = styled.div`
  margin-top: ${theme.spacing[4]};
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${status.sucesso.borda};
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.semibold};
`;
