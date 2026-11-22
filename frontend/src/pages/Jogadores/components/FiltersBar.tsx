/**
 * Responsabilidade única: Busca e filtros da listagem de jogadores
 */

import React from "react";
import { Search } from "lucide-react";
import { Campos, Cartao } from "@/components/layout/Pagina";
import { Button, Input, Select } from "@/components/ui";
import { GeneroJogador, NivelJogador, StatusJogador } from "@/types/jogador";

export interface FiltersBarProps {
  busca: string;
  setBusca: (value: string) => void;
  nivelFiltro: NivelJogador | "";
  setNivelFiltro: (value: NivelJogador | "") => void;
  statusFiltro: StatusJogador | "";
  setStatusFiltro: (value: StatusJogador | "") => void;
  generoFiltro: GeneroJogador | "";
  setGeneroFiltro: (value: GeneroJogador | "") => void;
  temFiltrosAtivos: boolean;
  onLimparFiltros: () => void;
}

const NIVEIS = [
  { value: "", label: "Todos" },
  { value: NivelJogador.INICIANTE, label: "Iniciante" },
  { value: NivelJogador.INTERMEDIARIO, label: "Intermediário" },
  { value: NivelJogador.AVANCADO, label: "Avançado" },
];

const STATUS = [
  { value: "", label: "Todos" },
  { value: StatusJogador.ATIVO, label: "Ativo" },
  { value: StatusJogador.INATIVO, label: "Inativo" },
  { value: StatusJogador.SUSPENSO, label: "Suspenso" },
];

const GENEROS = [
  { value: "", label: "Todos" },
  { value: GeneroJogador.MASCULINO, label: "Masculino" },
  { value: GeneroJogador.FEMININO, label: "Feminino" },
];

export const FiltersBar: React.FC<FiltersBarProps> = ({
  busca,
  setBusca,
  nivelFiltro,
  setNivelFiltro,
  statusFiltro,
  setStatusFiltro,
  generoFiltro,
  setGeneroFiltro,
  temFiltrosAtivos,
  onLimparFiltros,
}) => (
  <Cartao>
    <Input
      aria-label="Buscar jogador"
      fullWidth
      icon={<Search />}
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      placeholder="Nome, email ou telefone..."
    />

    <Campos $colunas>
      <Select
        label="Nível"
        fullWidth
        options={NIVEIS}
        value={nivelFiltro}
        onChange={(e) => setNivelFiltro(e.target.value as NivelJogador | "")}
      />
      <Select
        label="Status"
        fullWidth
        options={STATUS}
        value={statusFiltro}
        onChange={(e) => setStatusFiltro(e.target.value as StatusJogador | "")}
      />
      <Select
        label="Gênero"
        fullWidth
        options={GENEROS}
        value={generoFiltro}
        onChange={(e) => setGeneroFiltro(e.target.value as GeneroJogador | "")}
      />
    </Campos>

    {temFiltrosAtivos && (
      <div>
        <Button variant="ghost" size="sm" onClick={onLimparFiltros}>
          Limpar Filtros
        </Button>
      </div>
    )}
  </Cartao>
);

export default FiltersBar;
