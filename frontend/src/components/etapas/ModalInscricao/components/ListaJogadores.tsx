/**
 * Busca e seleção de jogadores para inscrever
 */

import React from "react";
import styled from "styled-components";
import { Button, EmptyState, Input } from "@/components/ui";
import {
  FiltroGenero,
  SeloGenero,
  ValorFiltroGenero,
} from "@/components/jogadores/Genero";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";
import { theme } from "@/styles/theme";
import { Jogador, NivelJogador } from "@/types/jogador";
import { getNivelLabel } from "@/utils/formatters";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface ListaJogadoresProps {
  busca: string;
  onBuscar: (termo: string) => void;
  filtroGenero: ValorFiltroGenero;
  onFiltrarGenero: (filtro: ValorFiltroGenero) => void;
  carregando: boolean;
  jogadores: Jogador[];
  totalCadastrados: number;
  /** Todos os que podem ser inscritos, sem os filtros */
  disponiveis: Jogador[];
  etapaNivel?: NivelJogador;
  /** Etapa mista: mostra o gênero e o filtro */
  isMisto: boolean;
  estaSelecionado: (jogadorId: string) => boolean;
  onToggle: (jogador: Jogador) => void;
  onCadastrar: () => void;
}

const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[4]};
`;

const Carregando = styled.div`
  padding: ${theme.spacing[12]} 0;
`;

const Cartao = styled.label<{ $selecionado: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[3]};
  border: 1px solid
    ${({ $selecionado }) => ($selecionado ? acao.primaria : superficie.borda)};
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $selecionado }) =>
    $selecionado ? acao.fundoClaro : superficie.fundo};
  cursor: pointer;

  &:hover {
    border-color: ${acao.primaria};
  }

  &:focus-within {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
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
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const DireitaDoCartao = styled.span`
  margin-left: auto;
`;

const Filtros = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

const Nome = styled.span`
  font-size: ${fontSize.base};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Complemento = styled.span`
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

export const ListaJogadores: React.FC<ListaJogadoresProps> = ({
  busca,
  onBuscar,
  filtroGenero,
  onFiltrarGenero,
  carregando,
  jogadores,
  totalCadastrados,
  disponiveis,
  etapaNivel,
  isMisto,
  estaSelecionado,
  onToggle,
  onCadastrar,
}) => {
  const tituloVazio = () => {
    if (busca) return "Nenhum jogador encontrado com esse termo";
    if (totalCadastrados === 0) {
      return etapaNivel
        ? "Nenhum jogador cadastrado neste nível"
        : "Nenhum jogador cadastrado";
    }
    if (disponiveis.length === 0) {
      return etapaNivel
        ? "Todos os jogadores deste nível já estão inscritos!"
        : "Todos os jogadores já estão inscritos!";
    }
    return "Nenhum jogador disponível com esse filtro";
  };

  const renderLista = () => {
    if (carregando) {
      return (
        <Carregando>
          <LoadingSpinner message="Carregando jogadores..." />
        </Carregando>
      );
    }

    if (jogadores.length === 0) {
      const nivel = etapaNivel
        ? `${getNivelLabel(etapaNivel).toLowerCase()} `
        : "";

      return (
        <EmptyState
          titulo={tituloVazio()}
          descricao={
            disponiveis.length === 0 && totalCadastrados > 0
              ? `${totalCadastrados} jogador(es) ${nivel}já inscrito(s) nesta etapa`
              : undefined
          }
          acao={
            !busca && totalCadastrados === 0 ? (
              <Button variant="outline" onClick={onCadastrar}>
                Cadastrar primeiro jogador
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <Grade>
        {jogadores.map((jogador) => {
          const selecionado = estaSelecionado(jogador.id);

          return (
            <Cartao key={jogador.id} $selecionado={selecionado}>
              <input
                type="checkbox"
                checked={selecionado}
                onChange={() => onToggle(jogador)}
              />
              <Dados>
                <Nome>{jogador.nome}</Nome>
                {jogador.email && <Complemento>{jogador.email}</Complemento>}
                {jogador.nivel && (
                  <Complemento>
                    Nível: {getNivelLabel(jogador.nivel).toLowerCase()}
                  </Complemento>
                )}
              </Dados>
              {isMisto && (
                <DireitaDoCartao>
                  <SeloGenero genero={jogador.genero} />
                </DireitaDoCartao>
              )}
            </Cartao>
          );
        })}
      </Grade>
    );
  };

  return (
    <>
      <Filtros>
        <Input
          type="search"
          fullWidth
          aria-label="Buscar jogador"
          placeholder="Buscar jogador por nome ou email..."
          value={busca}
          onChange={(e) => onBuscar(e.target.value)}
        />
        {isMisto && (
          <FiltroGenero
            valor={filtroGenero}
            onChange={onFiltrarGenero}
            generos={disponiveis.map((jogador) => jogador.genero)}
          />
        )}
      </Filtros>
      {renderLista()}
    </>
  );
};
