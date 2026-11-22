/**
 * Responsabilidade única: Orquestrar componentes da página de listagem de jogadores
 */

import React, { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { CabecalhoPagina, Pagina } from "@/components/layout/Pagina";
import { ModalImportarJogadores } from "@/components/modals/ModalImportarJogadores";
import { Alert, Button, Pagination } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { useListagemJogadores } from "./hooks/useListagemJogadores";
import { FiltersBar } from "./components/FiltersBar";
import { JogadoresList } from "./components/JogadoresList";

export const ListagemJogadores: React.FC = () => {
  useDocumentTitle("Jogadores");
  const navigate = useNavigate();
  const alertRef = useRef<HTMLDivElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);

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
    limite,
    paginaAtual,
    totalPaginas,
    irParaPagina,
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

  const handleNovoJogador = () => navigate("/admin/jogadores/novo");

  const handleImportSuccess = (resultado: {
    criados: number;
    ignorados: string[];
  }) => {
    let mensagem = `${resultado.criados} jogador(es) importado(s) com sucesso`;
    if (resultado.ignorados.length > 0) {
      mensagem += `. ${
        resultado.ignorados.length
      } jogador(es) ignorado(s) por já existirem: ${resultado.ignorados.join(
        ", "
      )}`;
    }
    setSuccessMessage(mensagem);
  };

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Jogadores"
        subtitulo="Gerencie os jogadores da sua arena"
        acoes={
          <>
            <Button
              variant="outline"
              icon={<Download size={16} />}
              onClick={handleExportarExcel}
              disabled={exportando}
            >
              {exportando ? "Exportando..." : "Exportar"}
            </Button>
            <Button
              variant="outline"
              icon={<Upload size={16} />}
              onClick={() => setShowImportModal(true)}
            >
              Importar
            </Button>
            <Button onClick={handleNovoJogador}>Novo Jogador</Button>
          </>
        }
      />

      {successMessage && (
        <div ref={alertRef}>
          <Alert variant="success" onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        </div>
      )}

      {errorMessage && (
        <div ref={alertRef}>
          <Alert variant="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        </div>
      )}

      <FiltersBar
        busca={busca}
        setBusca={setBusca}
        nivelFiltro={nivelFiltro}
        setNivelFiltro={setNivelFiltro}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        generoFiltro={generoFiltro}
        setGeneroFiltro={setGeneroFiltro}
        temFiltrosAtivos={temFiltrosAtivos}
        onLimparFiltros={limparFiltros}
      />

      <JogadoresList
        jogadores={jogadores}
        loading={loading}
        total={total}
        arenaSlug={arena?.slug}
        temFiltrosAtivos={temFiltrosAtivos}
        onNovo={handleNovoJogador}
        onDeletar={handleDeletarJogador}
      />

      {!loading && jogadores.length > 0 && (
        <Pagination
          currentPage={paginaAtual}
          totalPages={totalPaginas}
          totalItems={total}
          itemsPerPage={limite}
          onPageChange={irParaPagina}
        />
      )}

      <ModalImportarJogadores
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
        onImportar={handleImportarExcel}
        onExportarModelo={handleExportarExcel}
      />

      <Footer />
    </Pagina>
  );
};

export default ListagemJogadores;
