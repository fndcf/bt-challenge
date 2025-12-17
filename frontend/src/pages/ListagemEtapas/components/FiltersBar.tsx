/**
 * Responsabilidade única: Renderizar barra de filtros
 */

import React from "react";
import { StatusEtapa, FormatoEtapa } from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import * as S from "../ListagemEtapas.styles";

interface FiltersBarProps {
  // Valores dos filtros
  filtroStatus: StatusEtapa | "";
  filtroFormato: FormatoEtapa | "";
  filtroNivel: NivelJogador | "";
  filtroGenero: GeneroJogador | "";
  ordenacao: "dataRealizacao" | "criadoEm";

  // Handlers
  onStatusChange: (status: StatusEtapa | "") => void;
  onFormatoChange: (formato: FormatoEtapa | "") => void;
  onNivelChange: (nivel: NivelJogador | "") => void;
  onGeneroChange: (genero: GeneroJogador | "") => void;
  onOrdenacaoChange: (ordenacao: "dataRealizacao" | "criadoEm") => void;
  onLimparFiltros: () => void;

  // Estado
  temFiltrosAtivos: boolean;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filtroStatus,
  filtroFormato,
  filtroNivel,
  filtroGenero,
  ordenacao,
  onStatusChange,
  onFormatoChange,
  onNivelChange,
  onGeneroChange,
  onOrdenacaoChange,
  onLimparFiltros,
  temFiltrosAtivos,
}) => {
  return (
    <S.FiltersCard>
      <S.FiltersContent>
        {/* Filtro de Status */}
        <S.FilterGroup>
          <S.FilterLabel>Status:</S.FilterLabel>
          <S.Select
            value={filtroStatus}
            onChange={(e) => onStatusChange(e.target.value as StatusEtapa | "")}
          >
            <option value="">Todos os status</option>
            <option value={StatusEtapa.INSCRICOES_ABERTAS}>
              Inscrições Abertas
            </option>
            <option value={StatusEtapa.INSCRICOES_ENCERRADAS}>
              Inscrições Encerradas
            </option>
            <option value={StatusEtapa.CHAVES_GERADAS}>Chaves Geradas</option>
            <option value={StatusEtapa.FASE_ELIMINATORIA}>
              Fase Eliminatória
            </option>
            <option value={StatusEtapa.EM_ANDAMENTO}>Em Andamento</option>
            <option value={StatusEtapa.FINALIZADA}>Finalizadas</option>
          </S.Select>
        </S.FilterGroup>

        {/* Filtro de Formato */}
        <S.FilterGroup>
          <S.FilterLabel>Formato:</S.FilterLabel>
          <S.Select
            value={filtroFormato}
            onChange={(e) =>
              onFormatoChange(e.target.value as FormatoEtapa | "")
            }
          >
            <option value="">Todos os formatos</option>
            <option value={FormatoEtapa.DUPLA_FIXA}>Dupla Fixa</option>
            <option value={FormatoEtapa.REI_DA_PRAIA}>Rei da Praia</option>
            <option value={FormatoEtapa.SUPER_X}>Super X</option>
            <option value={FormatoEtapa.TEAMS}>Teams</option>
          </S.Select>
        </S.FilterGroup>

        {/* Filtro de Nível */}
        <S.FilterGroup>
          <S.FilterLabel>Nível:</S.FilterLabel>
          <S.Select
            value={filtroNivel}
            onChange={(e) => onNivelChange(e.target.value as NivelJogador | "")}
          >
            <option value="">Todos os níveis</option>
            <option value={NivelJogador.INICIANTE}>Iniciante</option>
            <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
            <option value={NivelJogador.AVANCADO}>Avançado</option>
          </S.Select>
        </S.FilterGroup>

        {/* Filtro de Gênero */}
        <S.FilterGroup>
          <S.FilterLabel>Gênero:</S.FilterLabel>
          <S.Select
            value={filtroGenero}
            onChange={(e) =>
              onGeneroChange(e.target.value as GeneroJogador | "")
            }
          >
            <option value="">Todos os gêneros</option>
            <option value={GeneroJogador.MASCULINO}>Masculino</option>
            <option value={GeneroJogador.FEMININO}>Feminino</option>
          </S.Select>
        </S.FilterGroup>

        {/* Ordenação */}
        <S.FilterGroup>
          <S.FilterLabel>Ordenar:</S.FilterLabel>
          <S.Select
            value={ordenacao}
            onChange={(e) =>
              onOrdenacaoChange(e.target.value as "dataRealizacao" | "criadoEm")
            }
          >
            <option value="dataRealizacao">Data de Realização</option>
            <option value="criadoEm">Data de Criação</option>
          </S.Select>
        </S.FilterGroup>

        {/* Botão Limpar Filtros */}
        {temFiltrosAtivos && (
          <S.ClearButton onClick={onLimparFiltros}>
            Limpar filtros
          </S.ClearButton>
        )}
      </S.FiltersContent>
    </S.FiltersCard>
  );
};

export default FiltersBar;
