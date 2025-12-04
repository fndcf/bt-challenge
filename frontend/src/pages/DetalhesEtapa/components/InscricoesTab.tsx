/**
 * InscricoesTab.tsx
 *
 * Responsabilidade única: Renderizar aba de inscrições
 */

import React, { useState, useMemo } from "react";
import { Etapa, Inscricao } from "@/types/etapa";
import { getNivelLabel } from "@/utils/formatters";
import { Pagination } from "@/components/ui";
import * as S from "../DetalhesEtapa.styles";

interface InscricoesTabProps {
  etapa: Etapa;
  inscricoes: Inscricao[];
  onInscricao: () => void;
  onCancelar: (inscricaoId: string, jogadorNome: string) => void;
  onCancelarMultiplos: (inscricaoIds: string[]) => Promise<void>;
}

export const InscricoesTab: React.FC<InscricoesTabProps> = ({
  etapa,
  inscricoes,
  onInscricao,
  onCancelar,
  onCancelarMultiplos,
}) => {
  const [jogadoresSelecionados, setJogadoresSelecionados] = useState<
    Set<string>
  >(new Set());
  const [excluindo, setExcluindo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const podeInscrever =
    etapa.status === "inscricoes_abertas" &&
    etapa.totalInscritos < etapa.maxJogadores;
  const podeEditar = etapa.status !== "finalizada" && !etapa.chavesGeradas;

  // Paginação
  const { paginatedInscricoes, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedInscricoes: inscricoes.slice(startIndex, endIndex),
      totalPages: Math.ceil(inscricoes.length / itemsPerPage),
    };
  }, [inscricoes, currentPage, itemsPerPage]);

  // Handlers de seleção
  const toggleSelecionarJogador = (inscricaoId: string) => {
    setJogadoresSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(inscricaoId)) {
        novo.delete(inscricaoId);
      } else {
        novo.add(inscricaoId);
      }
      return novo;
    });
  };

  const selecionarTodos = () => {
    if (jogadoresSelecionados.size === inscricoes.length) {
      setJogadoresSelecionados(new Set());
    } else {
      setJogadoresSelecionados(new Set(inscricoes.map((i) => i.id)));
    }
  };

  const handleExcluirSelecionados = async () => {
    if (jogadoresSelecionados.size === 0) return;

    const confirmacao = window.confirm(
      `Deseja cancelar ${jogadoresSelecionados.size} inscrição(ões)?`
    );

    if (!confirmacao) return;

    try {
      setExcluindo(true);
      await onCancelarMultiplos(Array.from(jogadoresSelecionados));
      setJogadoresSelecionados(new Set());
    } catch (error: any) {
      alert(error.message || "Erro ao cancelar inscrições");
    } finally {
      setExcluindo(false);
    }
  };

  // Estado vazio
  if (inscricoes.length === 0) {
    return (
      <S.InscricoesEmpty>
        <p>Nenhum jogador inscrito ainda</p>
        {podeInscrever && (
          <S.Button $variant="blue" onClick={onInscricao}>
            Inscrever Jogador
          </S.Button>
        )}
      </S.InscricoesEmpty>
    );
  }

  return (
    <>
      {/* Botão Inscrever */}
      {podeInscrever && (
        <S.InscricoesHeader>
          <S.Button $variant="blue" onClick={onInscricao}>
            Inscrever Jogador
          </S.Button>
        </S.InscricoesHeader>
      )}

      {/* Barra de Seleção */}
      {podeEditar && (
        <S.SelectionBar>
          <S.SelectionInfo>
            <S.SelectAllButton onClick={selecionarTodos}>
              {jogadoresSelecionados.size === inscricoes.length
                ? "✓ Desmarcar Todos"
                : "☐ Selecionar Todos"}
            </S.SelectAllButton>

            {jogadoresSelecionados.size > 0 && (
              <S.SelectionCount>
                {jogadoresSelecionados.size} selecionado(s)
              </S.SelectionCount>
            )}
          </S.SelectionInfo>

          <S.DeleteSelectedButton
            onClick={handleExcluirSelecionados}
            disabled={jogadoresSelecionados.size === 0 || excluindo}
          >
            <span>{excluindo ? "Excluindo..." : "Excluir Selecionados"}</span>
          </S.DeleteSelectedButton>
        </S.SelectionBar>
      )}

      {/* Grid de Inscrições */}
      <S.InscricoesGrid>
        {paginatedInscricoes.map((inscricao) => (
          <S.InscricaoCardSelectable
            key={inscricao.id}
            $selected={jogadoresSelecionados.has(inscricao.id)}
          >
            {/* Checkbox (apenas se pode editar) */}
            {podeEditar && (
              <S.CheckboxWrapper>
                <S.Checkbox
                  checked={jogadoresSelecionados.has(inscricao.id)}
                  onChange={() => toggleSelecionarJogador(inscricao.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </S.CheckboxWrapper>
            )}

            <S.InscricaoInfo>
              <S.InscricaoNome>
                {inscricao.jogadorNome || "Jogador"}
              </S.InscricaoNome>
              <S.InscricaoNivel>
                {inscricao.jogadorNivel
                  ? getNivelLabel(inscricao.jogadorNivel)
                  : ""}
              </S.InscricaoNivel>
            </S.InscricaoInfo>

            {/* Botão individual de cancelar */}
            {podeEditar && (
              <S.CancelButton
                onClick={() =>
                  onCancelar(inscricao.id, inscricao.jogadorNome || "Jogador")
                }
              >
                ✕
              </S.CancelButton>
            )}
          </S.InscricaoCardSelectable>
        ))}
      </S.InscricoesGrid>

      {/* Paginação */}
      {inscricoes.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={inscricoes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default InscricoesTab;
