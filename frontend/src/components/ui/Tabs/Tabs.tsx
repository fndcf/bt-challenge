/**
 * Abas. A aba ativa usa a cor do formato da etapa, quando informado.
 *
 * Teclado: setas, Home e End mudam de aba; o Tab entra e sai do grupo.
 */

import React, { useRef } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";

const { texto, superficie, acao } = theme.semantic;

export interface Aba<T extends string = string> {
  id: T;
  label: React.ReactNode;
}

interface TabsProps<T extends string> {
  abas: Aba<T>[];
  ativa: T;
  onChange: (id: T) => void;
  /** Nome do grupo de abas para leitores de tela */
  rotulo: string;
  formato?: FormatoEtapa;
}

const Lista = styled.div`
  display: flex;
  gap: ${theme.spacing[1]};
  overflow-x: auto;
  border-bottom: 1px solid ${superficie.borda};
`;

const Botao = styled.button<{ $ativa: boolean; $cor: string }>`
  flex-shrink: 0;
  min-height: 44px;
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  border: none;
  border-bottom: 3px solid ${({ $ativa, $cor }) => ($ativa ? $cor : "transparent")};
  background: none;
  color: ${({ $ativa, $cor }) => ($ativa ? $cor : texto.secundario)};
  font-family: inherit;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.semibold};
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: ${({ $cor }) => $cor};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: -2px;
  }
`;

export const Tabs = <T extends string>({
  abas,
  ativa,
  onChange,
  rotulo,
  formato,
}: TabsProps<T>) => {
  const listaRef = useRef<HTMLDivElement>(null);
  const cor = formato ? getCoresFormato(formato).solido : acao.primaria;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const atual = abas.findIndex((aba) => aba.id === ativa);
    const ultimo = abas.length - 1;
    const destinos: Record<string, number> = {
      ArrowRight: atual === ultimo ? 0 : atual + 1,
      ArrowLeft: atual <= 0 ? ultimo : atual - 1,
      Home: 0,
      End: ultimo,
    };
    const destino = destinos[e.key];
    if (destino === undefined) return;

    e.preventDefault();
    onChange(abas[destino].id);
    const botoes = listaRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]'
    );
    botoes?.[destino]?.focus();
  };

  return (
    <Lista
      ref={listaRef}
      role="tablist"
      aria-label={rotulo}
      onKeyDown={handleKeyDown}
    >
      {abas.map((aba) => (
        <Botao
          key={aba.id}
          type="button"
          role="tab"
          aria-selected={aba.id === ativa}
          tabIndex={aba.id === ativa ? 0 : -1}
          $ativa={aba.id === ativa}
          $cor={cor}
          onClick={() => onChange(aba.id)}
        >
          {aba.label}
        </Botao>
      ))}
    </Lista>
  );
};

export default Tabs;
