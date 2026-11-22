/**
 * Responsabilidade única: Renderizar barra de filtros
 */

import React from "react";
import { Campos, Cartao } from "@/components/layout/Pagina";
import { Button, Select } from "@/components/ui";
import { FormatoEtapa, StatusEtapa } from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

type Ordenacao = "dataRealizacao" | "criadoEm";

interface FiltersBarProps {
  // Valores dos filtros
  filtroStatus: StatusEtapa | "";
  filtroFormato: FormatoEtapa | "";
  filtroNivel: NivelJogador | "";
  filtroGenero: GeneroJogador | "";
  ordenacao: Ordenacao;

  // Handlers
  onStatusChange: (status: StatusEtapa | "") => void;
  onFormatoChange: (formato: FormatoEtapa | "") => void;
  onNivelChange: (nivel: NivelJogador | "") => void;
  onGeneroChange: (genero: GeneroJogador | "") => void;
  onOrdenacaoChange: (ordenacao: Ordenacao) => void;
  onLimparFiltros: () => void;

  // Estado
  temFiltrosAtivos: boolean;
}

const STATUS = [
  { value: "", label: "Todos os status" },
  { value: StatusEtapa.INSCRICOES_ABERTAS, label: "Inscrições Abertas" },
  { value: StatusEtapa.INSCRICOES_ENCERRADAS, label: "Inscrições Encerradas" },
  { value: StatusEtapa.CHAVES_GERADAS, label: "Chaves Geradas" },
  { value: StatusEtapa.FASE_ELIMINATORIA, label: "Fase Eliminatória" },
  { value: StatusEtapa.EM_ANDAMENTO, label: "Em Andamento" },
  { value: StatusEtapa.FINALIZADA, label: "Finalizadas" },
];

const FORMATOS = [
  { value: "", label: "Todos os formatos" },
  { value: FormatoEtapa.DUPLA_FIXA, label: "Dupla Fixa" },
  { value: FormatoEtapa.REI_DA_PRAIA, label: "Rei da Praia" },
  { value: FormatoEtapa.SUPER_X, label: "Super X" },
  { value: FormatoEtapa.TEAMS, label: "Teams" },
];

const NIVEIS = [
  { value: "", label: "Todos os níveis" },
  { value: NivelJogador.INICIANTE, label: "Iniciante" },
  { value: NivelJogador.INTERMEDIARIO, label: "Intermediário" },
  { value: NivelJogador.AVANCADO, label: "Avançado" },
];

const GENEROS = [
  { value: "", label: "Todos os gêneros" },
  { value: GeneroJogador.MASCULINO, label: "Masculino" },
  { value: GeneroJogador.FEMININO, label: "Feminino" },
  { value: GeneroJogador.MISTO, label: "Misto" },
];

const ORDENACOES = [
  { value: "dataRealizacao", label: "Data de Realização" },
  { value: "criadoEm", label: "Data de Criação" },
];

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
}) => (
  <Cartao>
    <Campos $colunas>
      <Select
        label="Status"
        fullWidth
        options={STATUS}
        value={filtroStatus}
        onChange={(e) => onStatusChange(e.target.value as StatusEtapa | "")}
      />
      <Select
        label="Formato"
        fullWidth
        options={FORMATOS}
        value={filtroFormato}
        onChange={(e) => onFormatoChange(e.target.value as FormatoEtapa | "")}
      />
      <Select
        label="Nível"
        fullWidth
        options={NIVEIS}
        value={filtroNivel}
        onChange={(e) => onNivelChange(e.target.value as NivelJogador | "")}
      />
      <Select
        label="Gênero"
        fullWidth
        options={GENEROS}
        value={filtroGenero}
        onChange={(e) => onGeneroChange(e.target.value as GeneroJogador | "")}
      />
      <Select
        label="Ordenar"
        fullWidth
        options={ORDENACOES}
        value={ordenacao}
        onChange={(e) => onOrdenacaoChange(e.target.value as Ordenacao)}
      />
    </Campos>

    {temFiltrosAtivos && (
      <div>
        <Button variant="ghost" size="sm" onClick={onLimparFiltros}>
          Limpar filtros
        </Button>
      </div>
    )}
  </Cartao>
);

export default FiltersBar;
