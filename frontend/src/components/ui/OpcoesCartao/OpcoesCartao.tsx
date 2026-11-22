/**
 * Escolha única em cartões (título e descrição). Com `formato`, a opção
 * escolhida usa a cor do formato.
 */

import { useId } from "react";
import styled from "styled-components";
import { getCoresFormato } from "@/styles/semantic";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface Opcao<T extends string> {
  valor: T;
  titulo: string;
  descricao: string;
  formato?: FormatoEtapa;
}

interface OpcoesCartaoProps<T extends string> {
  /** Nome do grupo para leitores de tela */
  rotulo: string;
  opcoes: Opcao<T>[];
  valor: T | undefined;
  onChange: (valor: T) => void;
  disabled?: boolean;
}

const Grupo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
  gap: ${theme.spacing[3]};
`;

const Cartao = styled.label<{ $ativa: boolean; $cor: string; $fundo: string }>`
  display: flex;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
  border: 1px solid
    ${({ $ativa, $cor }) => ($ativa ? $cor : superficie.bordaForte)};
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $ativa, $fundo }) => ($ativa ? $fundo : superficie.fundo)};
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
  cursor: pointer;

  &:hover {
    border-color: ${({ $cor }) => $cor};
  }

  &:focus-within {
    outline: 2px solid ${({ $cor }) => $cor};
    outline-offset: 1px;
  }

  input {
    flex-shrink: 0;
    width: 1.125rem;
    height: 1.125rem;
    margin: ${theme.spacing[1]} 0 0 0;
    accent-color: ${({ $cor }) => $cor};
  }

  strong {
    display: block;
    font-size: ${fontSize.base};
    font-weight: ${fontWeight.semibold};
    color: ${texto.principal};
  }
`;

export const OpcoesCartao = <T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
  disabled = false,
}: OpcoesCartaoProps<T>) => {
  const nome = useId();

  return (
    <Grupo role="radiogroup" aria-label={rotulo}>
      {opcoes.map((opcao) => {
        const cores = opcao.formato && getCoresFormato(opcao.formato);

        return (
          <Cartao
            key={opcao.valor}
            $ativa={valor === opcao.valor}
            $cor={cores?.solido ?? acao.primaria}
            $fundo={cores?.claro ?? acao.fundoClaro}
          >
            <input
              type="radio"
              name={nome}
              checked={valor === opcao.valor}
              onChange={() => onChange(opcao.valor)}
              disabled={disabled}
            />
            <span>
              <strong>{opcao.titulo}</strong>
              {opcao.descricao}
            </span>
          </Cartao>
        );
      })}
    </Grupo>
  );
};

export default OpcoesCartao;
