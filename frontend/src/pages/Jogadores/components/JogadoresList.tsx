/**
 * Responsabilidade única: Exibir lista de jogadores com estados de loading/erro/vazio
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JogadorCard } from "@/components/jogadores/JogadorCard";
import { CarregandoPagina, Grade, Texto } from "@/components/layout/Pagina";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { Button, EmptyState } from "@/components/ui";
import { Jogador } from "@/types/jogador";

export interface JogadoresListProps {
  jogadores: Jogador[];
  loading: boolean;
  total: number;
  arenaSlug?: string;
  temFiltrosAtivos: boolean;
  onNovo: () => void;
  onDeletar: (jogador: Jogador) => Promise<boolean>;
}

export const JogadoresList: React.FC<JogadoresListProps> = ({
  jogadores,
  loading,
  total,
  arenaSlug,
  temFiltrosAtivos,
  onNovo,
  onDeletar,
}) => {
  const navigate = useNavigate();

  // Jogador com a exclusão em confirmação
  const [aDeletar, setADeletar] = useState<Jogador | null>(null);
  const [deletando, setDeletando] = useState(false);

  const confirmarDelecao = async () => {
    if (!aDeletar) return;

    setDeletando(true);
    // Fecha o modal com sucesso ou erro: a mensagem aparece no topo da página
    await onDeletar(aDeletar);
    setDeletando(false);
    setADeletar(null);
  };

  if (loading) {
    return <CarregandoPagina mensagem="Carregando jogadores..." />;
  }

  if (jogadores.length === 0) {
    return (
      <EmptyState
        titulo="Nenhum jogador encontrado"
        descricao={
          temFiltrosAtivos
            ? "Tente ajustar os filtros para ver mais resultados."
            : "Cadastre o primeiro jogador da sua arena!"
        }
        acao={
          !temFiltrosAtivos && (
            <Button onClick={onNovo}>Cadastrar Primeiro Jogador</Button>
          )
        }
      />
    );
  }

  return (
    <>
      <Texto>
        Mostrando {jogadores.length} de {total} jogador
        {total !== 1 ? "es" : ""}
      </Texto>

      <Grade $preencher>
        {jogadores.map((jogador) => (
          <JogadorCard
            key={jogador.id}
            jogador={jogador}
            arenaSlug={arenaSlug}
            onEdit={() => navigate(`/admin/jogadores/${jogador.id}/editar`)}
            onDelete={setADeletar}
          />
        ))}
      </Grade>

      <ConfirmDeleteModal
        isOpen={!!aDeletar}
        title="Deletar Jogador"
        message="Tem certeza que deseja deletar este jogador?"
        itemName={aDeletar?.nome}
        onConfirm={confirmarDelecao}
        onCancel={() => setADeletar(null)}
        loading={deletando}
      />
    </>
  );
};

export default JogadoresList;
