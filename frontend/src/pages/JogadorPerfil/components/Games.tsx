/**
 * Games vencidos / perdidos
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const { status } = theme.semantic;

const Valor = styled.span<{ $tom: "sucesso" | "erro" }>`
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${({ $tom }) => status[$tom].texto};
`;

export const Games: React.FC<{ vencidos: number; perdidos: number }> = ({
  vencidos,
  perdidos,
}) => (
  <span title={`${vencidos} vencidos, ${perdidos} perdidos`}>
    <Valor $tom="sucesso">{vencidos}</Valor>/
    <Valor $tom="erro">{perdidos}</Valor>
  </span>
);

export default Games;
