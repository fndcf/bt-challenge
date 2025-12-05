/**
 * Responsabilidade única: Filtros de listagem de jogadores
 */

import React from "react";
import { NivelJogador, StatusJogador, GeneroJogador } from "@/types/jogador";
import * as S from "../Jogadores.styles";

export interface FiltersBarProps {
  nivelFiltro: NivelJogador | "";
  setNivelFiltro: (value: NivelJogador | "") => void;
  statusFiltro: StatusJogador | "";
  setStatusFiltro: (value: StatusJogador | "") => void;
  generoFiltro: GeneroJogador | "";
  setGeneroFiltro: (value: GeneroJogador | "") => void;
  temFiltrosAtivos: boolean;
  onLimparFiltros: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  nivelFiltro,
  setNivelFiltro,
  statusFiltro,
  setStatusFiltro,
  generoFiltro,
  setGeneroFiltro,
  temFiltrosAtivos,
  onLimparFiltros,
}) => {
  return (
    <S.FiltersContainer>
      <S.FiltersGrid>
        {/* Nível */}
        <S.FilterItem>
          <S.FilterLabel htmlFor="nivel">Nível</S.FilterLabel>
          <S.Select
            id="nivel"
            value={nivelFiltro}
            onChange={(e) => setNivelFiltro(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value={NivelJogador.INICIANTE}>Iniciante</option>
            <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
            <option value={NivelJogador.AVANCADO}>Avançado</option>
          </S.Select>
        </S.FilterItem>

        {/* Status */}
        <S.FilterItem>
          <S.FilterLabel htmlFor="status">Status</S.FilterLabel>
          <S.Select
            id="status"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value={StatusJogador.ATIVO}>Ativo</option>
            <option value={StatusJogador.INATIVO}>Inativo</option>
            <option value={StatusJogador.SUSPENSO}>Suspenso</option>
          </S.Select>
        </S.FilterItem>

        {/* Gênero */}
        <S.FilterItem>
          <S.FilterLabel htmlFor="genero">Gênero</S.FilterLabel>
          <S.Select
            id="genero"
            value={generoFiltro}
            onChange={(e) => setGeneroFiltro(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value={GeneroJogador.MASCULINO}>Masculino</option>
            <option value={GeneroJogador.FEMININO}>Feminino</option>
          </S.Select>
        </S.FilterItem>
      </S.FiltersGrid>

      {/* Limpar Filtros */}
      {temFiltrosAtivos && (
        <S.ClearButton onClick={onLimparFiltros}>Limpar Filtros</S.ClearButton>
      )}
    </S.FiltersContainer>
  );
};

export default FiltersBar;
