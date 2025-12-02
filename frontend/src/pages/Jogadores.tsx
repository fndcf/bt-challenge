import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";
import jogadorService from "../services/jogadorService";
import { arenaAdminService } from "../services/arenaAdminService";
import {
  Jogador,
  FiltrosJogador,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
} from "../types/jogador";
import { Arena } from "../types/arena";
import JogadorCard from "../components/JogadorCard";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Footer from "@/components/Footer";

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

// ============== HEADER ==============

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const NewButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    width: auto;
  }
`;

// ============== ALERT ==============

const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  ${(props) =>
    props.$type === "success"
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  `
      : `
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
  `}
`;

const AlertContent = styled.div`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const AlertClose = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

// ============== FILTROS ==============

const FiltersContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const FilterItem = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  ${(props) =>
    props.$fullWidth &&
    `
    @media (min-width: 640px) {
      grid-column: 1 / -1;
    }
  `}
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const Select = styled.select`
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #f3f4f6;
  color: #374151;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 640px) {
    width: auto;
  }
`;

// ============== RESULTADO INFO ==============

const ResultInfo = styled.div`
  margin-bottom: 1.5rem;

  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;

    @media (min-width: 768px) {
      font-size: 0.9375rem;
    }
  }
`;

// ============== GRID ==============

const JogadoresGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

// ============== LOADING ==============

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingMessage = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
`;

// ============== EMPTY STATE ==============

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 5rem 2rem;
  }
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

const EmptyText = styled.p`
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 0.9375rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const EmptyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// ============== PAGINAÇÃO ==============

const Pagination = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: white;
  color: #374151;
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #2563eb;
    color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const PaginationInfo = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// ============== COMPONENTE ==============

const ListagemJogadores: React.FC = () => {
  useDocumentTitle("Jogadores");

  const navigate = useNavigate();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Estado da arena
  const [arena, setArena] = useState<Arena | null>(null);

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
  const [generoFiltro, setGeneroFiltro] = useState<GeneroJogador | "">("");

  // Paginação
  const [total, setTotal] = useState(0);
  const [limite] = useState(12);
  const [offset, setOffset] = useState(0);
  const [temMais, setTemMais] = useState(false);

  /**
   * ✅ Carregar arena ao montar
   */
  useEffect(() => {
    const carregarArena = async () => {
      try {
        // Opção 1: Se você tem um service que retorna a arena do usuário logado
        const arenaData = await arenaAdminService.obterMinhaArena();
        setArena(arenaData);
      } catch (error) {
        // Opção 2: Fallback - pegar do localStorage se tiver
        const arenaLocalStorage = localStorage.getItem("arena");
        if (arenaLocalStorage) {
          try {
            const arenaParsed = JSON.parse(arenaLocalStorage);
            setArena(arenaParsed);
          } catch (e) {}
        }
      }
    };

    carregarArena();
  }, []);

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
    <Container>
      {/* Header */}
      <Header>
        <HeaderInfo>
          <Title>Jogadores</Title>
          <Subtitle>Gerencie os jogadores da sua arena</Subtitle>
        </HeaderInfo>
        <NewButton onClick={handleNovoJogador}>Novo Jogador</NewButton>
      </Header>

      {/* Mensagens */}
      {successMessage && (
        <Alert $type="success">
          <AlertContent>{successMessage}</AlertContent>
          <AlertClose onClick={() => setSuccessMessage("")}>×</AlertClose>
        </Alert>
      )}

      {errorMessage && (
        <Alert $type="error">
          <AlertContent>{errorMessage}</AlertContent>
          <AlertClose onClick={() => setErrorMessage("")}>×</AlertClose>
        </Alert>
      )}

      {/* Filtros */}
      <FiltersContainer>
        <FiltersGrid>
          {/* Busca */}
          <FilterItem $fullWidth>
            <FilterLabel htmlFor="busca">Buscar</FilterLabel>
            <Input
              type="text"
              id="busca"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setOffset(0);
              }}
              placeholder="Nome, email ou telefone..."
            />
          </FilterItem>

          {/* Nível */}
          <FilterItem>
            <FilterLabel htmlFor="nivel">Nível</FilterLabel>
            <Select
              id="nivel"
              value={nivelFiltro}
              onChange={(e) => {
                setNivelFiltro(e.target.value as any);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              <option value={NivelJogador.INICIANTE}>Iniciante</option>
              <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
              <option value={NivelJogador.AVANCADO}>Avançado</option>
            </Select>
          </FilterItem>

          {/* Status */}
          <FilterItem>
            <FilterLabel htmlFor="status">Status</FilterLabel>
            <Select
              id="status"
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value as any);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              <option value={StatusJogador.ATIVO}>Ativo</option>
              <option value={StatusJogador.INATIVO}>Inativo</option>
              <option value={StatusJogador.SUSPENSO}>Suspenso</option>
            </Select>
          </FilterItem>

          {/* Gênero */}
          <FilterItem>
            <FilterLabel htmlFor="genero">Gênero</FilterLabel>
            <Select
              id="genero"
              value={generoFiltro}
              onChange={(e) => {
                setGeneroFiltro(e.target.value as any);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              <option value={GeneroJogador.MASCULINO}>Masculino</option>
              <option value={GeneroJogador.FEMININO}>Feminino</option>
            </Select>
          </FilterItem>
        </FiltersGrid>

        {/* Limpar Filtros */}
        {(busca || nivelFiltro || statusFiltro || generoFiltro) && (
          <ClearButton onClick={limparFiltros}>Limpar Filtros</ClearButton>
        )}
      </FiltersContainer>

      {/* Resultado Info */}
      <ResultInfo>
        <p>
          Mostrando {jogadores.length} de {total} jogador
          {total !== 1 ? "es" : ""}
        </p>
      </ResultInfo>

      {/* Loading */}
      {loading && (
        <LoadingContainer>
          <Spinner />
          <LoadingMessage>Carregando jogadores...</LoadingMessage>
        </LoadingContainer>
      )}

      {/* Lista de Jogadores */}
      {!loading && jogadores.length > 0 && (
        <JogadoresGrid>
          {jogadores.map((jogador) => (
            <JogadorCard
              key={jogador.id}
              jogador={jogador}
              arenaSlug={arena?.slug}
              onEdit={handleEditarJogador}
              onDelete={handleDeletarJogador}
            />
          ))}
        </JogadoresGrid>
      )}

      {/* Empty State */}
      {!loading && jogadores.length === 0 && (
        <EmptyState>
          <EmptyTitle>Nenhum jogador encontrado</EmptyTitle>
          {busca || nivelFiltro || statusFiltro || generoFiltro ? (
            <EmptyText>
              Tente ajustar os filtros para ver mais resultados.
            </EmptyText>
          ) : (
            <EmptyText>Cadastre o primeiro jogador da sua arena!</EmptyText>
          )}
          <EmptyButton onClick={handleNovoJogador}>
            Cadastrar Primeiro Jogador
          </EmptyButton>
        </EmptyState>
      )}

      {/* Paginação */}
      {!loading && jogadores.length > 0 && totalPaginas > 1 && (
        <Pagination>
          <PaginationButton
            onClick={handlePaginaAnterior}
            disabled={offset === 0}
          >
            ← Anterior
          </PaginationButton>
          <PaginationInfo>
            Página {paginaAtual} de {totalPaginas}
          </PaginationInfo>
          <PaginationButton onClick={handleProximaPagina} disabled={!temMais}>
            Próxima →
          </PaginationButton>
        </Pagination>
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
      <Footer></Footer>
    </Container>
  );
};

export default ListagemJogadores;
