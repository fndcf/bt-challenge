/**
 * Botão só com ícone. O rótulo é obrigatório: vira a dica e o nome acessível.
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const { acao, status } = theme.semantic;

interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  rotulo: string;
  icone: React.ReactNode;
  /** perigo: fica vermelho ao passar o mouse (remover, excluir) */
  tom?: "neutro" | "perigo";
}

const Botao = styled.button<{ $tom: "neutro" | "perigo" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: none;
  color: inherit;
  cursor: pointer;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover:not(:disabled) {
    background: ${({ $tom }) =>
      $tom === "perigo" ? status.erro.fundo : "rgba(0, 0, 0, 0.08)"};
    ${({ $tom }) => $tom === "perigo" && `color: ${status.erro.texto};`}
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const IconButton: React.FC<IconButtonProps> = ({
  rotulo,
  icone,
  tom = "neutro",
  ...props
}) => (
  <Botao type="button" title={rotulo} aria-label={rotulo} $tom={tom} {...props}>
    {icone}
  </Botao>
);

export default IconButton;
