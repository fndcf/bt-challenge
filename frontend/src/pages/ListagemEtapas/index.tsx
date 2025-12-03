/**
 * ListagemEtapas/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da página de listagem de etapas
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - ISP: Interfaces específicas para cada componente
 * - DIP: Componentes dependem de abstrações (props), não de implementações
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useListagemEtapas } from "./hooks/useListagemEtapas";
import { PageHeader } from "./components/PageHeader";
import { StatsCards } from "./components/StatsCards";
import { FiltersBar } from "./components/FiltersBar";
import { EtapasList } from "./components/EtapasList";
import { Pagination } from "./components/Pagination";
import * as S from "./ListagemEtapas.styles";

export const ListagemEtapas: React.FC = () => {
  const navigate = useNavigate();

  // Hook centralizado com toda a lógica de negócio
  const {
    etapas,
    loading,
    error,
    stats,
    filtroStatus,
    filtroFormato,
    filtroNivel,
    filtroGenero,
    ordenacao,
    paginaAtual,
    totalPaginas,
    totalEtapas,
    etapasPorPagina,
    setFiltroStatus,
    setFiltroFormato,
    setFiltroNivel,
    setFiltroGenero,
    setOrdenacao,
    limparFiltros,
    proximaPagina,
    paginaAnterior,
    irParaPagina,
    temFiltrosAtivos,
  } = useListagemEtapas();

  // Handlers
  const handleCriarEtapa = () => {
    navigate("/admin/etapas/criar");
  };

  return (
    <S.Container>
      {/* Cabeçalho */}
      <PageHeader onCriarClick={handleCriarEtapa} />

      {/* Cards de Estatísticas */}
      <StatsCards stats={stats} />

      {/* Barra de Filtros */}
      <FiltersBar
        filtroStatus={filtroStatus}
        filtroFormato={filtroFormato}
        filtroNivel={filtroNivel}
        filtroGenero={filtroGenero}
        ordenacao={ordenacao}
        onStatusChange={setFiltroStatus}
        onFormatoChange={setFiltroFormato}
        onNivelChange={setFiltroNivel}
        onGeneroChange={setFiltroGenero}
        onOrdenacaoChange={setOrdenacao}
        onLimparFiltros={limparFiltros}
        temFiltrosAtivos={temFiltrosAtivos}
      />

      {/* Lista de Etapas */}
      <EtapasList
        etapas={etapas}
        loading={loading}
        error={error}
        temFiltrosAtivos={temFiltrosAtivos}
        onCriarClick={handleCriarEtapa}
      />

      {/* Paginação */}
      <Pagination
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        totalEtapas={totalEtapas}
        etapasPorPagina={etapasPorPagina}
        onProximaPagina={proximaPagina}
        onPaginaAnterior={paginaAnterior}
        onIrParaPagina={irParaPagina}
      />

      {/* Rodapé */}
      <Footer />
    </S.Container>
  );
};

export default ListagemEtapas;
