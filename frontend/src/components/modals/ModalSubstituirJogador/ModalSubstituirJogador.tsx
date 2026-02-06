/**
 * Modal para substituir jogador após geração de chaves
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getEtapaService } from "@/services";
import { Inscricao } from "@/types/etapa";

interface JogadorDisponivel {
  id: string;
  nome: string;
  nivel: string;
  genero: string;
}

interface ModalSubstituirJogadorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  etapaId: string;
  inscricoes: Inscricao[];
}

// ============== STYLED COMPONENTS ==============

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
`;

const OverlayBackground = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  transition: opacity 0.2s;
`;

const ModalWrapper = styled.div`
  position: relative;
  z-index: 51;
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: none;
`;

const ModalContainer = styled.div`
  position: relative;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 48rem;
  width: 100%;
  padding: 1.5rem;
  pointer-events: auto;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const SelectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SelectionColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const ColumnTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
`;

const PlayerList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
`;

const PlayerItem = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: none;
  background: ${(props) => (props.$selected ? "#dbeafe" : "transparent")};
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(props) => (props.$selected ? "#dbeafe" : "#f9fafb")};
  }
`;

const PlayerName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const PlayerInfo = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

const Arrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #9ca3af;
  padding-top: 2rem;

  @media (max-width: 640px) {
    transform: rotate(90deg);
    padding: 0.5rem 0;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const SelectedInfo = styled.div`
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const SelectedLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
`;

const SelectedName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  display: block;
  margin-top: 0.25rem;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

// ============== HELPER FUNCTIONS ==============

const formatNivel = (nivel: string): string => {
  switch (nivel) {
    case "iniciante":
      return "Iniciante";
    case "intermediario":
      return "Intermediário";
    case "avancado":
      return "Avançado";
    default:
      return nivel;
  }
};

const formatGenero = (genero: string): string => {
  switch (genero) {
    case "masculino":
      return "M";
    case "feminino":
      return "F";
    case "misto":
      return "Misto";
    default:
      return genero;
  }
};

// ============== COMPONENTE ==============

export const ModalSubstituirJogador: React.FC<ModalSubstituirJogadorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  etapaId,
  inscricoes,
}) => {
  const [jogadoresDisponiveis, setJogadoresDisponiveis] = useState<JogadorDisponivel[]>([]);
  const [loadingDisponiveis, setLoadingDisponiveis] = useState(true);
  const [jogadorAntigoId, setJogadorAntigoId] = useState<string | null>(null);
  const [jogadorNovoId, setJogadorNovoId] = useState<string | null>(null);
  const [buscaAntigo, setBuscaAntigo] = useState("");
  const [buscaNovo, setBuscaNovo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const etapaService = getEtapaService();

  // Carregar jogadores disponíveis
  useEffect(() => {
    if (isOpen) {
      const carregarDisponiveis = async () => {
        try {
          setLoadingDisponiveis(true);
          const disponiveis = await etapaService.buscarJogadoresDisponiveis(etapaId);
          setJogadoresDisponiveis(disponiveis);
        } catch (err: any) {
          setError(err.message || "Erro ao carregar jogadores disponíveis");
        } finally {
          setLoadingDisponiveis(false);
        }
      };

      carregarDisponiveis();
    }
  }, [isOpen, etapaId]);

  // Resetar estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setJogadorAntigoId(null);
      setJogadorNovoId(null);
      setBuscaAntigo("");
      setBuscaNovo("");
      setError(null);
    }
  }, [isOpen]);

  // Filtrar jogadores inscritos
  const jogadoresInscritos = inscricoes
    .filter((i) =>
      i.jogadorNome.toLowerCase().includes(buscaAntigo.toLowerCase())
    )
    .sort((a, b) => a.jogadorNome.localeCompare(b.jogadorNome));

  // Filtrar jogadores disponíveis
  const jogadoresDisponiveisFiltrados = jogadoresDisponiveis
    .filter((j) =>
      j.nome.toLowerCase().includes(buscaNovo.toLowerCase())
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Jogadores selecionados
  const jogadorAntigo = inscricoes.find((i) => i.jogadorId === jogadorAntigoId);
  const jogadorNovo = jogadoresDisponiveis.find((j) => j.id === jogadorNovoId);

  const handleConfirm = async () => {
    if (!jogadorAntigoId || !jogadorNovoId) return;

    try {
      setLoading(true);
      setError(null);
      await etapaService.substituirJogador(etapaId, jogadorAntigoId, jogadorNovoId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao substituir jogador");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <OverlayBackground onClick={!loading ? handleClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          <Title>Substituir Jogador</Title>
          <Description>
            Selecione o jogador a ser substituído e o novo jogador.
            Só é possível substituir antes de qualquer partida ser jogada.
          </Description>

          {error && (
            <SelectedInfo style={{ background: "#fef2f2", marginBottom: "1rem" }}>
              <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</span>
            </SelectedInfo>
          )}

          <SelectionGrid>
            {/* Coluna: Jogador a ser substituído */}
            <SelectionColumn>
              <ColumnTitle>Jogador a ser substituído</ColumnTitle>
              <SearchInput
                type="text"
                placeholder="Buscar jogador..."
                value={buscaAntigo}
                onChange={(e) => setBuscaAntigo(e.target.value)}
              />
              <PlayerList>
                {jogadoresInscritos.length === 0 ? (
                  <EmptyMessage>Nenhum jogador encontrado</EmptyMessage>
                ) : (
                  jogadoresInscritos.map((inscricao) => (
                    <PlayerItem
                      key={inscricao.jogadorId}
                      $selected={jogadorAntigoId === inscricao.jogadorId}
                      onClick={() => setJogadorAntigoId(inscricao.jogadorId)}
                    >
                      <PlayerName>{inscricao.jogadorNome}</PlayerName>
                      <PlayerInfo>
                        {formatNivel(inscricao.jogadorNivel)} - {formatGenero(inscricao.jogadorGenero)}
                      </PlayerInfo>
                    </PlayerItem>
                  ))
                )}
              </PlayerList>
            </SelectionColumn>

            {/* Seta */}
            <Arrow>→</Arrow>

            {/* Coluna: Novo jogador */}
            <SelectionColumn>
              <ColumnTitle>Novo jogador</ColumnTitle>
              <SearchInput
                type="text"
                placeholder="Buscar jogador..."
                value={buscaNovo}
                onChange={(e) => setBuscaNovo(e.target.value)}
              />
              <PlayerList>
                {loadingDisponiveis ? (
                  <LoadingMessage>Carregando jogadores...</LoadingMessage>
                ) : jogadoresDisponiveisFiltrados.length === 0 ? (
                  <EmptyMessage>Nenhum jogador disponível</EmptyMessage>
                ) : (
                  jogadoresDisponiveisFiltrados.map((jogador) => (
                    <PlayerItem
                      key={jogador.id}
                      $selected={jogadorNovoId === jogador.id}
                      onClick={() => setJogadorNovoId(jogador.id)}
                    >
                      <PlayerName>{jogador.nome}</PlayerName>
                      <PlayerInfo>
                        {formatNivel(jogador.nivel)} - {formatGenero(jogador.genero)}
                      </PlayerInfo>
                    </PlayerItem>
                  ))
                )}
              </PlayerList>
            </SelectionColumn>
          </SelectionGrid>

          {/* Resumo da seleção */}
          {(jogadorAntigo || jogadorNovo) && (
            <SelectedInfo>
              <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                <div>
                  <SelectedLabel>Sai</SelectedLabel>
                  <SelectedName>
                    {jogadorAntigo?.jogadorNome || "Não selecionado"}
                  </SelectedName>
                </div>
                <div style={{ alignSelf: "center", color: "#9ca3af" }}>→</div>
                <div>
                  <SelectedLabel>Entra</SelectedLabel>
                  <SelectedName>
                    {jogadorNovo?.nome || "Não selecionado"}
                  </SelectedName>
                </div>
              </div>
            </SelectedInfo>
          )}

          <ButtonsRow>
            <Button
              type="button"
              $variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              $variant="primary"
              onClick={handleConfirm}
              disabled={!jogadorAntigoId || !jogadorNovoId || loading}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Substituindo...</span>
                </>
              ) : (
                <span>Confirmar Substituição</span>
              )}
            </Button>
          </ButtonsRow>
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalSubstituirJogador;
