/**
 * Jogador numa lista de escolha (inscrição, substituição)
 *
 * - com `selecionado`: caixa de marcar, para escolher vários
 * - sem `selecionado`: botão, para escolher um
 */

import React from "react";
import styled from "styled-components";
import { SeloGenero } from "@/components/jogadores/Genero";
import { Badge } from "@/components/ui";
import { theme } from "@/styles/theme";
import { getNivelLabel } from "@/utils/formatters";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight, fontFamily } = theme.typography;

interface LinhaJogadorProps {
  nome: string;
  /** Linha abaixo do nome (ex.: email) */
  detalhe?: string;
  nivel?: string;
  genero?: string;
  selecionado?: boolean;
  onEscolher: () => void;
}

export const ListaDeJogadores = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
  gap: ${theme.spacing[2]};
`;

const Linha = styled.label<{ $selecionado?: boolean }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  width: 100%;
  min-height: 48px;
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid
    ${({ $selecionado }) => ($selecionado ? acao.primaria : superficie.borda)};
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $selecionado }) =>
    $selecionado ? acao.fundoClaro : superficie.fundo};
  color: ${texto.principal};
  font-family: ${fontFamily.sans};
  font-size: ${fontSize.base};
  text-align: left;
  cursor: pointer;

  /* Só com mouse: no toque o realce ficava preso na última linha tocada */
  @media (hover: hover) {
    &:hover {
      border-color: ${acao.primaria};
    }

    &:focus-within {
      outline: 2px solid ${acao.primaria};
      outline-offset: 1px;
    }
  }

  input {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    accent-color: ${acao.primaria};
    cursor: pointer;
  }
`;

const Dados = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Nome = styled.span`
  display: block;
  font-weight: ${fontWeight.semibold};
`;

const Detalhe = styled.span`
  display: block;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Selos = styled.span`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${theme.spacing[1]};
`;

export const LinhaJogador: React.FC<LinhaJogadorProps> = ({
  nome,
  detalhe,
  nivel,
  genero,
  selecionado,
  onEscolher,
}) => {
  const conteudo = (
    <>
      <Dados>
        <Nome>{nome}</Nome>
        {detalhe && <Detalhe>{detalhe}</Detalhe>}
      </Dados>
      <Selos>
        {nivel && <Badge>{getNivelLabel(nivel)}</Badge>}
        <SeloGenero genero={genero} />
      </Selos>
    </>
  );

  if (selecionado === undefined) {
    return (
      <Linha as="button" type="button" onClick={onEscolher}>
        {conteudo}
      </Linha>
    );
  }

  return (
    <Linha $selecionado={selecionado}>
      <input type="checkbox" checked={selecionado} onChange={onEscolher} />
      {conteudo}
    </Linha>
  );
};

export default LinhaJogador;
