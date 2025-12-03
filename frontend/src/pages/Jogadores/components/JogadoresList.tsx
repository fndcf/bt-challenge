/**
 * JogadoresList.tsx
 *
 * Responsabilidade única: Exibir lista de jogadores com estados de loading/erro/vazio
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Jogador } from "@/types/jogador";
import { JogadorCard } from "@/components/jogadores/JogadorCard";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import * as S from "../Jogadores.styles";

export interface JogadoresListProps {
  jogadores: Jogador[];
  loading: boolean;
  total: number;
  arenaSlug?: string;
  temFiltrosAtivos: boolean;
  onDeletar: (jogador: Jogador) => Promise<void>;
}

export const JogadoresList: React.FC<JogadoresListProps> = ({
  jogadores,
  loading,
  total,
  arenaSlug,
  temFiltrosAtivos,
  onDeletar,
}) => {
  const navigate = useNavigate();

  // Modal de exclusão
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    jogador: null as Jogador | null,
    loading: false,
  });

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
      await onDeletar(deleteModal.jogador);
      setDeleteModal({ isOpen: false, jogador: null, loading: false });
    } catch (error) {
      setDeleteModal({ isOpen: false, jogador: null, loading: false });
    }
  };

  const cancelarDelecao = () => {
    setDeleteModal({ isOpen: false, jogador: null, loading: false });
  };

  const handleNovoJogador = () => {
    navigate("/admin/jogadores/novo");
  };

  // Loading
  if (loading) {
    return (
      <S.LoadingContainer>
        <S.Spinner />
        <S.LoadingMessage>Carregando jogadores...</S.LoadingMessage>
      </S.LoadingContainer>
    );
  }

  // Empty State
  if (jogadores.length === 0) {
    return (
      <>
        <S.EmptyState>
          <S.EmptyTitle>Nenhum jogador encontrado</S.EmptyTitle>
          {temFiltrosAtivos ? (
            <S.EmptyText>
              Tente ajustar os filtros para ver mais resultados.
            </S.EmptyText>
          ) : (
            <S.EmptyText>Cadastre o primeiro jogador da sua arena!</S.EmptyText>
          )}
          <S.EmptyButton onClick={handleNovoJogador}>
            Cadastrar Primeiro Jogador
          </S.EmptyButton>
        </S.EmptyState>
      </>
    );
  }

  // Lista com jogadores
  return (
    <>
      {/* Resultado Info */}
      <S.ResultInfo>
        <p>
          Mostrando {jogadores.length} de {total} jogador
          {total !== 1 ? "es" : ""}
        </p>
      </S.ResultInfo>

      {/* Grid de Jogadores */}
      <S.JogadoresGrid>
        {jogadores.map((jogador) => (
          <JogadorCard
            key={jogador.id}
            jogador={jogador}
            arenaSlug={arenaSlug}
            onEdit={handleEditarJogador}
            onDelete={handleDeletarJogador}
          />
        ))}
      </S.JogadoresGrid>

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
    </>
  );
};

export default JogadoresList;
