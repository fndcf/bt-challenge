/**
 * Modal para definir jogadores de uma partida vazia (formação manual)
 * Permite selecionar quais jogadores de cada equipe irão jogar
 */

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { Modal } from "@/components/ui/Modal";
import { PartidaTeams, JogadorEquipe } from "@/types/teams";

interface ModalDefinirJogadoresPartidaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dupla1Ids: [string, string], dupla2Ids: [string, string]) => Promise<void>;
  partida: PartidaTeams;
  equipe1Nome: string;
  equipe2Nome: string;
  equipe1Jogadores: JogadorEquipe[];
  equipe2Jogadores: JogadorEquipe[];
  partidasConfrontoComJogadores: PartidaTeams[]; // Para validar duplas já usadas
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoBox = styled.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #1e40af;
  font-size: 0.875rem;

  strong {
    display: block;
    margin-bottom: 0.25rem;
  }
`;

const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #dc2626;
  font-size: 0.875rem;
`;

const PartidaInfo = styled.div`
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-align: center;
  color: #374151;
`;

const EquipesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EquipeCard = styled.div`
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const EquipeHeader = styled.div`
  background: #6b7280;
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 600;
  text-align: center;
`;

const JogadoresContainer = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const JogadorCheckbox = styled.label<{ $disabled: boolean; $used: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${(props) =>
    props.$used ? "#fee2e2" :
    props.$disabled ? "#f3f4f6" :
    "white"};
  border: 1px solid ${(props) =>
    props.$used ? "#fca5a5" :
    props.$disabled ? "#e5e7eb" :
    "#d1d5db"};
  border-radius: 0.5rem;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.$disabled || props.$used ? 0.6 : 1)};
  transition: all 0.2s;

  &:hover {
    ${(props) => !props.$disabled && !props.$used && `
      border-color: #3b82f6;
      background: #eff6ff;
    `}
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  }
`;

const JogadorNome = styled.span`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
`;

const UsedLabel = styled.span`
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 500;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button<{ $variant: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
      : `
    background: #e5e7eb;
    color: #374151;
    &:hover:not(:disabled) {
      background: #d1d5db;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============== COMPONENT ==============

export const ModalDefinirJogadoresPartida: React.FC<ModalDefinirJogadoresPartidaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  partida,
  equipe1Nome,
  equipe2Nome,
  equipe1Jogadores,
  equipe2Jogadores,
  partidasConfrontoComJogadores,
}) => {
  const [selectedEquipe1, setSelectedEquipe1] = useState<string[]>([]);
  const [selectedEquipe2, setSelectedEquipe2] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obter duplas e jogadores já usados no confronto
  const { duplasUsadas, jogadoresUsados } = useMemo(() => {
    const duplas = new Set<string>();
    const jogadores = new Set<string>();
    const isDecider = partida.tipoJogo === "decider";

    for (const p of partidasConfrontoComJogadores) {
      if (p.id === partida.id) continue; // Ignorar partida atual

      // Se a partida atual é decider, só validar duplas repetidas
      // Se não é decider, validar tanto duplas quanto jogadores
      const podeValidarJogadores = !isDecider && p.tipoJogo !== "decider";

      // Verificar se dupla1 está preenchida
      if (p.dupla1.length === 2) {
        const ids = [p.dupla1[0].id, p.dupla1[1].id].sort().join("-");
        duplas.add(ids);

        if (podeValidarJogadores) {
          jogadores.add(p.dupla1[0].id);
          jogadores.add(p.dupla1[1].id);
        }
      }

      // Verificar se dupla2 está preenchida
      if (p.dupla2.length === 2) {
        const ids = [p.dupla2[0].id, p.dupla2[1].id].sort().join("-");
        duplas.add(ids);

        if (podeValidarJogadores) {
          jogadores.add(p.dupla2[0].id);
          jogadores.add(p.dupla2[1].id);
        }
      }
    }

    return { duplasUsadas: duplas, jogadoresUsados: jogadores };
  }, [partidasConfrontoComJogadores, partida.id, partida.tipoJogo]);

  // Verificar se um jogador já participou do confronto
  const isJogadorJaJogou = (jogadorId: string): boolean => {
    const isDecider = partida.tipoJogo === "decider";
    // No decider, jogadores podem repetir, apenas duplas não
    if (isDecider) return false;
    return jogadoresUsados.has(jogadorId);
  };

  // Verificar se uma dupla já foi usada
  const isDuplaUsada = (jogadorId: string, outroJogadorId: string | null): boolean => {
    if (!outroJogadorId) return false;
    const duplaKey = [jogadorId, outroJogadorId].sort().join("-");
    return duplasUsadas.has(duplaKey);
  };

  const handleToggleEquipe1 = (jogadorId: string) => {
    setError(null);

    if (selectedEquipe1.includes(jogadorId)) {
      setSelectedEquipe1(selectedEquipe1.filter(id => id !== jogadorId));
    } else {
      if (selectedEquipe1.length >= 2) {
        setError("Selecione apenas 2 jogadores por equipe");
        return;
      }

      // Verificar se o jogador já participou do confronto (exceto no decider)
      if (isJogadorJaJogou(jogadorId)) {
        setError("Este jogador já participou de uma partida neste confronto");
        return;
      }

      // Verificar se forma dupla já usada
      if (selectedEquipe1.length === 1 && isDuplaUsada(jogadorId, selectedEquipe1[0])) {
        setError("Esta dupla já jogou neste confronto");
        return;
      }

      setSelectedEquipe1([...selectedEquipe1, jogadorId]);
    }
  };

  const handleToggleEquipe2 = (jogadorId: string) => {
    setError(null);

    if (selectedEquipe2.includes(jogadorId)) {
      setSelectedEquipe2(selectedEquipe2.filter(id => id !== jogadorId));
    } else {
      if (selectedEquipe2.length >= 2) {
        setError("Selecione apenas 2 jogadores por equipe");
        return;
      }

      // Verificar se o jogador já participou do confronto (exceto no decider)
      if (isJogadorJaJogou(jogadorId)) {
        setError("Este jogador já participou de uma partida neste confronto");
        return;
      }

      // Verificar se forma dupla já usada
      if (selectedEquipe2.length === 1 && isDuplaUsada(jogadorId, selectedEquipe2[0])) {
        setError("Esta dupla já jogou neste confronto");
        return;
      }

      setSelectedEquipe2([...selectedEquipe2, jogadorId]);
    }
  };

  const handleConfirm = async () => {
    if (selectedEquipe1.length !== 2 || selectedEquipe2.length !== 2) {
      setError("Selecione exatamente 2 jogadores de cada equipe");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(
        selectedEquipe1 as [string, string],
        selectedEquipe2 as [string, string]
      );

      // Resetar estado
      setSelectedEquipe1([]);
      setSelectedEquipe2([]);
    } catch (err: any) {
      setError(err.message || "Erro ao definir jogadores");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedEquipe1([]);
    setSelectedEquipe2([]);
    setError(null);
    onClose();
  };

  const canConfirm = selectedEquipe1.length === 2 && selectedEquipe2.length === 2 && !loading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Definir Jogadores da Partida" loading={loading}>
      <Container>
        <PartidaInfo>
          {partida.tipoJogo === "feminino" && "Partida Feminina"}
          {partida.tipoJogo === "masculino" && "Partida Masculina"}
          {partida.tipoJogo === "misto" && "Partida Mista"}
          {partida.tipoJogo === "decider" && "Partida Decider"}
          {" - "}
          {equipe1Nome} vs {equipe2Nome}
        </PartidaInfo>

        <InfoBox>
          <strong>Instruções:</strong>
          Selecione 2 jogadores de cada equipe para formar as duplas desta partida.
          As duplas não podem se repetir no mesmo confronto.
        </InfoBox>

        {error && <ErrorBox>{error}</ErrorBox>}

        <EquipesContainer>
          {/* Equipe 1 */}
          <EquipeCard>
            <EquipeHeader>
              {equipe1Nome} ({selectedEquipe1.length}/2)
            </EquipeHeader>
            <JogadoresContainer>
              {equipe1Jogadores.map((jogador) => {
                const isSelected = selectedEquipe1.includes(jogador.id);
                const isDisabled = !isSelected && selectedEquipe1.length >= 2;
                const outroSelecionado = selectedEquipe1.find(id => id !== jogador.id);

                // Verificar se o jogador já participou do confronto
                const jaJogou = isJogadorJaJogou(jogador.id);

                // Verificar se forma dupla já usada
                const duplaUsada = outroSelecionado && isDuplaUsada(jogador.id, outroSelecionado);

                const isUsed = jaJogou || duplaUsada;

                return (
                  <JogadorCheckbox
                    key={jogador.id}
                    $disabled={isDisabled}
                    $used={!!isUsed}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleEquipe1(jogador.id)}
                      disabled={isDisabled || !!isUsed}
                    />
                    <JogadorNome>{jogador.nome}</JogadorNome>
                    {jaJogou && <UsedLabel>Já jogou</UsedLabel>}
                    {!jaJogou && duplaUsada && <UsedLabel>Dupla já usada</UsedLabel>}
                  </JogadorCheckbox>
                );
              })}
            </JogadoresContainer>
          </EquipeCard>

          {/* Equipe 2 */}
          <EquipeCard>
            <EquipeHeader>
              {equipe2Nome} ({selectedEquipe2.length}/2)
            </EquipeHeader>
            <JogadoresContainer>
              {equipe2Jogadores.map((jogador) => {
                const isSelected = selectedEquipe2.includes(jogador.id);
                const isDisabled = !isSelected && selectedEquipe2.length >= 2;
                const outroSelecionado = selectedEquipe2.find(id => id !== jogador.id);

                // Verificar se o jogador já participou do confronto
                const jaJogou = isJogadorJaJogou(jogador.id);

                // Verificar se forma dupla já usada
                const duplaUsada = outroSelecionado && isDuplaUsada(jogador.id, outroSelecionado);

                const isUsed = jaJogou || duplaUsada;

                return (
                  <JogadorCheckbox
                    key={jogador.id}
                    $disabled={isDisabled}
                    $used={!!isUsed}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleEquipe2(jogador.id)}
                      disabled={isDisabled || !!isUsed}
                    />
                    <JogadorNome>{jogador.nome}</JogadorNome>
                    {jaJogou && <UsedLabel>Já jogou</UsedLabel>}
                    {!jaJogou && duplaUsada && <UsedLabel>Dupla já usada</UsedLabel>}
                  </JogadorCheckbox>
                );
              })}
            </JogadoresContainer>
          </EquipeCard>
        </EquipesContainer>

        <ButtonsContainer>
          <Button $variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button $variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </ButtonsContainer>
      </Container>
    </Modal>
  );
};

export default ModalDefinirJogadoresPartida;
