/**
 * Barra de progresso (0 a 100). Fica verde quando completa.
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const { superficie, acao, status } = theme.semantic;

interface BarraProgressoProps {
  valor: number;
  /** Nome acessível (ex.: "Vagas preenchidas") */
  rotulo: string;
}

const Trilho = styled.div`
  width: 100%;
  height: 0.5rem;
  overflow: hidden;
  border-radius: ${theme.borderRadius.full};
  background: ${superficie.borda};
`;

const Preenchimento = styled.div<{ $valor: number }>`
  width: ${({ $valor }) => $valor}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ $valor }) =>
    $valor === 100 ? status.sucesso.texto : acao.primaria};
  transition: width 0.3s ease;
`;

export const BarraProgresso: React.FC<BarraProgressoProps> = ({
  valor,
  rotulo,
}) => {
  const limitado = Math.min(100, Math.max(0, valor));

  return (
    <Trilho
      role="progressbar"
      aria-label={rotulo}
      aria-valuenow={limitado}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <Preenchimento $valor={limitado} />
    </Trilho>
  );
};

export default BarraProgresso;
