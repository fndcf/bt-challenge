/**
 * Responsabilidade única: Orquestrar componentes da página de listagem de etapas
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { CabecalhoPagina, Pagina } from "@/components/layout/Pagina";
import { Button, Pagination } from "@/components/ui";
import { useListagemEtapas } from "./hooks/useListagemEtapas";
import { StatsCards } from "./components/StatsCards";
import { FiltersBar } from "./components/FiltersBar";
import { EtapasList } from "./components/EtapasList";

export const ListagemEtapas: React.FC = () => {
  const navigate = useNavigate();

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
    irParaPagina,
    temFiltrosAtivos,
  } = useListagemEtapas();

  const handleCriarEtapa = () => {
    navigate("/admin/etapas/criar");
  };

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Etapas"
        subtitulo="Gerencie as etapas do torneio"
        acoes={<Button onClick={handleCriarEtapa}>Criar Etapa</Button>}
      />

      <StatsCards stats={stats} />

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

      <EtapasList
        etapas={etapas}
        loading={loading}
        error={error}
        temFiltrosAtivos={temFiltrosAtivos}
        onCriarClick={handleCriarEtapa}
      />

      {totalEtapas > 0 && (
        <Pagination
          currentPage={paginaAtual}
          totalPages={totalPaginas}
          totalItems={totalEtapas}
          itemsPerPage={etapasPorPagina}
          onPageChange={irParaPagina}
        />
      )}

      <Footer />
    </Pagina>
  );
};

export default ListagemEtapas;
