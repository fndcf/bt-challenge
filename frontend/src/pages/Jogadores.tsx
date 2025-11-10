import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks";
import jogadorService from "../services/jogadorService";
import {
  Jogador,
  FiltrosJogador,
  NivelJogador,
  StatusJogador,
} from "../types/jogador";
import JogadorCard from "../components/JogadorCard";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./Jogadores.css";

const ListagemJogadores: React.FC = () => {
  useDocumentTitle("Jogadores");

  const navigate = useNavigate();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal de exclusão
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    jogador: null as Jogador | null,
    loading: false,
  });

  // Filtros
  const [busca, setBusca] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<NivelJogador | "">("");
  const [statusFiltro, setStatusFiltro] = useState<StatusJogador | "">("");
  const [generoFiltro, setGeneroFiltro] = useState<
    "masculino" | "feminino" | "outro" | ""
  >("");

  // Paginação
  const [total, setTotal] = useState(0);
  const [limite] = useState(12);
  const [offset, setOffset] = useState(0);
  const [temMais, setTemMais] = useState(false);

  /**
   * Carregar jogadores
   */
  const carregarJogadores = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const filtros: FiltrosJogador = {
        busca: busca || undefined,
        nivel: nivelFiltro || undefined,
        status: statusFiltro || undefined,
        genero: generoFiltro || undefined,
        limite,
        offset,
        ordenarPor: "nome",
        ordem: "asc",
      };

      const resultado = await jogadorService.listar(filtros);
      setJogadores(resultado.jogadores);
      setTotal(resultado.total);
      setTemMais(resultado.temMais);
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao carregar jogadores");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carregar ao montar e quando filtros mudarem
   */
  useEffect(() => {
    carregarJogadores();
  }, [busca, nivelFiltro, statusFiltro, generoFiltro, offset]);

  /**
   * Limpar filtros
   */
  const limparFiltros = () => {
    setBusca("");
    setNivelFiltro("");
    setStatusFiltro("");
    setGeneroFiltro("");
    setOffset(0);
  };

  /**
   * Handlers de ações
   */
  const handleNovoJogador = () => {
    navigate("/admin/jogadores/novo");
  };

  const handleEditarJogador = (jogador: Jogador) => {
    navigate(`/admin/jogadores/${jogador.id}/editar`);
  };

  const handleVisualizarJogador = (jogador: Jogador) => {
    navigate(`/admin/jogadores/${jogador.id}`);
  };

  const handleDeletarJogador = (jogador: Jogador) => {
    setDeleteModal({
      isOpen: true,
      jogador,
      loading: false,
    });
  };

  const confirmarDelecao = async () => {
    if (!deleteModal.jogador) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));

      await jogadorService.deletar(deleteModal.jogador.id);

      setSuccessMessage(`${deleteModal.jogador.nome} foi deletado com sucesso`);
      setDeleteModal({ isOpen: false, jogador: null, loading: false });

      carregarJogadores();
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao deletar jogador");
      setDeleteModal({ isOpen: false, jogador: null, loading: false });
    }
  };

  const cancelarDelecao = () => {
    setDeleteModal({ isOpen: false, jogador: null, loading: false });
  };

  /**
   * Paginação
   */
  const handlePaginaAnterior = () => {
    if (offset > 0) {
      setOffset(offset - limite);
    }
  };

  const handleProximaPagina = () => {
    if (temMais) {
      setOffset(offset + limite);
    }
  };

  const paginaAtual = Math.floor(offset / limite) + 1;
  const totalPaginas = Math.ceil(total / limite);

  return (
    <div className="jogadores-page">
      {/* Header */}
      <div className="listagem-header">
        <div className="header-info">
          <h1>👥 Jogadores</h1>
          <p>Gerencie os jogadores da sua arena</p>
        </div>
        <button className="btn-novo-jogador" onClick={handleNovoJogador}>
          ➕ Novo Jogador
        </button>
      </div>

      {/* Mensagens */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
          autoClose={3000}
        />
      )}

      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      )}

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-grid">
          {/* Busca */}
          <div className="filtro-item filtro-busca">
            <label htmlFor="busca">🔍 Buscar</label>
            <input
              type="text"
              id="busca"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setOffset(0);
              }}
              placeholder="Nome, email ou telefone..."
            />
          </div>

          {/* Nível */}
          <div className="filtro-item">
            <label htmlFor="nivel">🎯 Nível</label>
            <select
              id="nivel"
              value={nivelFiltro}
              onChange={(e) => {
                setNivelFiltro(e.target.value as any);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              <option value={NivelJogador.INICIANTE}>🌱 Iniciante</option>
              <option value={NivelJogador.INTERMEDIARIO}>
                ⚡ Intermediário
              </option>
              <option value={NivelJogador.AVANCADO}>🔥 Avançado</option>
              <option value={NivelJogador.PROFISSIONAL}>⭐ Profissional</option>
            </select>
          </div>

          {/* Status */}
          <div className="filtro-item">
            <label htmlFor="status">📊 Status</label>
            <select
              id="status"
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value as any);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              <option value={StatusJogador.ATIVO}>✅ Ativo</option>
              <option value={StatusJogador.INATIVO}>⏸️ Inativo</option>
              <option value={StatusJogador.SUSPENSO}>🚫 Suspenso</option>
            </select>
          </div>

          {/* Gênero */}
          <div className="filtro-item">
            <label htmlFor="genero">👤 Gênero</label>
            <select
              id="genero"
              value={generoFiltro}
              onChange={(e) => {
                setGeneroFiltro(e.target.value as any);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              <option value="masculino">♂️ Masculino</option>
              <option value="feminino">♀️ Feminino</option>
              <option value="outro">⚧ Outro</option>
            </select>
          </div>
        </div>

        {/* Limpar Filtros */}
        {(busca || nivelFiltro || statusFiltro || generoFiltro) && (
          <button className="btn-limpar-filtros" onClick={limparFiltros}>
            🗑️ Limpar Filtros
          </button>
        )}
      </div>

      {/* Resultado Info */}
      <div className="resultado-info">
        <p>
          Mostrando {jogadores.length} de {total} jogador
          {total !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <LoadingSpinner size="large" message="Carregando jogadores..." />
        </div>
      )}

      {/* Lista de Jogadores */}
      {!loading && jogadores.length > 0 && (
        <div className="jogadores-grid">
          {jogadores.map((jogador) => (
            <JogadorCard
              key={jogador.id}
              jogador={jogador}
              onView={handleVisualizarJogador}
              onEdit={handleEditarJogador}
              onDelete={handleDeletarJogador}
            />
          ))}
        </div>
      )}

      <button className="btn-novo-jogador" onClick={handleNovoJogador}>
        ➕ Novo Jogador
      </button>

      {/* Empty State */}
      {!loading && jogadores.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎾</div>
          <h2>Nenhum jogador encontrado</h2>
          {busca || nivelFiltro || statusFiltro || generoFiltro ? (
            <p>Tente ajustar os filtros para ver mais resultados.</p>
          ) : (
            <p>Cadastre o primeiro jogador da sua arena!</p>
          )}
          <button className="btn-primary" onClick={handleNovoJogador}>
            ➕ Cadastrar Primeiro Jogador
          </button>
        </div>
      )}

      {/* Paginação */}
      {!loading && jogadores.length > 0 && totalPaginas > 1 && (
        <div className="paginacao">
          <button
            className="btn-paginacao"
            onClick={handlePaginaAnterior}
            disabled={offset === 0}
          >
            ← Anterior
          </button>
          <span className="paginacao-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            className="btn-paginacao"
            onClick={handleProximaPagina}
            disabled={!temMais}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Deletar Jogador"
        message="Tem certeza que deseja deletar este jogador?"
        itemName={deleteModal.jogador?.nome}
        onConfirm={confirmarDelecao}
        onCancel={cancelarDelecao}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default ListagemJogadores;
