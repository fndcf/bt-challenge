/**
 * Busca e seleção de jogadores para inscrever
 */

import React from "react";
import styled from "styled-components";
import { Button, EmptyState, Input } from "@/components/ui";
import { FiltroGenero, ValorFiltroGenero } from "@/components/jogadores/Genero";
import {
  LinhaJogador,
  ListaDeJogadores,
} from "@/components/jogadores/LinhaJogador";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";
import { theme } from "@/styles/theme";
import { Jogador, NivelJogador } from "@/types/jogador";
import { getNivelLabel } from "@/utils/formatters";

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

const Carregando = styled.div`
  padding: ${theme.spacing[12]} 0;
`;

// Presa no topo: dá para buscar sem voltar a lista toda
const Filtros = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: ${theme.spacing[2]} 0;
  background: ${theme.semantic.superficie.fundo};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
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
      <ListaDeJogadores>
        {jogadores.map((jogador) => (
          <LinhaJogador
            key={jogador.id}
            nome={jogador.nome}
            detalhe={jogador.email}
            // Com nível definido pela etapa, todos são iguais
            nivel={etapaNivel ? undefined : jogador.nivel}
            genero={isMisto ? jogador.genero : undefined}
            selecionado={estaSelecionado(jogador.id)}
            onEscolher={() => onToggle(jogador)}
          />
        ))}
      </ListaDeJogadores>
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
