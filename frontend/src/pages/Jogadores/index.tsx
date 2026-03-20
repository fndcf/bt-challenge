/**
 * Responsabilidade única: Orquestrar componentes da página de listagem de jogadores
 */

import React, { useRef, useEffect, useState } from "react";
import { useDocumentTitle } from "@/hooks";
import { Footer } from "@/components/layout/Footer";
import { ModalImportarJogadores } from "@/components/modals/ModalImportarJogadores";
import { useListagemJogadores } from "./hooks/useListagemJogadores";
import { PageHeader } from "./components/PageHeader";
import { SearchBar } from "./components/SearchBar";
import { FiltersBar } from "./components/FiltersBar";
import { JogadoresList } from "./components/JogadoresList";
import { Pagination } from "./components/Pagination";
import * as S from "./Jogadores.styles";

export const ListagemJogadores: React.FC = () => {
  useDocumentTitle("Jogadores");
  const alertRef = useRef<HTMLDivElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Hook centralizado com toda a lógica de negócio
  const {
    jogadores,
    loading,
    arena,
    errorMessage,
    successMessage,
    setErrorMessage,
    setSuccessMessage,
    busca,
    setBusca,
    nivelFiltro,
    setNivelFiltro,
    statusFiltro,
    setStatusFiltro,
    generoFiltro,
    setGeneroFiltro,
    limparFiltros,
    temFiltrosAtivos,
    total,
    offset,
    temMais,
    paginaAtual,
    totalPaginas,
    handlePaginaAnterior,
    handleProximaPagina,
    handleDeletarJogador,
    exportando,
    handleExportarExcel,
    handleImportarExcel,
  } = useListagemJogadores();

  // Scroll para o alert quando aparecer mensagem
  useEffect(() => {
    if ((errorMessage || successMessage) && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [errorMessage, successMessage]);

  const handleImportSuccess = (criados: number) => {
    setSuccessMessage(`${criados} jogador(es) importado(s) com sucesso`);
  };

  return (
    <S.Container>
      {/* Header */}
      <PageHeader
        title="Jogadores"
        subtitle="Gerencie os jogadores da sua arena"
        onExportar={handleExportarExcel}
        onImportar={() => setShowImportModal(true)}
        exportando={exportando}
      />

      {/* Mensagens de Sucesso */}
      {successMessage && (
        <S.Alert ref={alertRef} $type="success">
          <S.AlertContent>{successMessage}</S.AlertContent>
          <S.AlertClose onClick={() => setSuccessMessage("")}>×</S.AlertClose>
        </S.Alert>
      )}

      {/* Mensagens de Erro */}
      {errorMessage && (
        <S.Alert ref={alertRef} $type="error">
          <S.AlertContent>{errorMessage}</S.AlertContent>
          <S.AlertClose onClick={() => setErrorMessage("")}>×</S.AlertClose>
        </S.Alert>
      )}

      {/* Busca */}
      <SearchBar value={busca} onChange={setBusca} />

      {/* Filtros */}
      <FiltersBar
        nivelFiltro={nivelFiltro}
        setNivelFiltro={setNivelFiltro}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        generoFiltro={generoFiltro}
        setGeneroFiltro={setGeneroFiltro}
        temFiltrosAtivos={temFiltrosAtivos}
        onLimparFiltros={limparFiltros}
      />

      {/* Lista de Jogadores */}
      <JogadoresList
        jogadores={jogadores}
        loading={loading}
        total={total}
        arenaSlug={arena?.slug}
        temFiltrosAtivos={temFiltrosAtivos}
        onDeletar={handleDeletarJogador}
      />

      {/* Paginação */}
      {!loading && jogadores.length > 0 && (
        <Pagination
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          temMais={temMais}
          offset={offset}
          onPaginaAnterior={handlePaginaAnterior}
          onProximaPagina={handleProximaPagina}
        />
      )}

      {/* Modal de Importação */}
      <ModalImportarJogadores
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
        onImportar={handleImportarExcel}
        onExportarModelo={handleExportarExcel}
      />

      {/* Rodapé */}
      <Footer />
    </S.Container>
  );
};

export default ListagemJogadores;
