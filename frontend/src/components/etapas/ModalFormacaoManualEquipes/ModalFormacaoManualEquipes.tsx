/**
 * Modal para formação manual de equipes no formato TEAMS
 * Permite ao organizador arrastar/selecionar jogadores para cada equipe
 */

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { Modal } from "@/components/ui/Modal";
import { Inscricao } from "@/types/etapa";
import { VarianteTeams } from "@/types/etapa";
import { FormacaoManualEquipeDTO } from "@/types/teams";

interface ModalFormacaoManualEquipesProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formacoes: FormacaoManualEquipeDTO[]) => Promise<void>;
  inscricoes: Inscricao[];
  varianteTeams: VarianteTeams;
  isMisto?: boolean;
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

const EquipesContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const EquipeCard = styled.div<{ $isComplete: boolean }>`
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  background: ${(props) => (props.$isComplete ? "#dcfce7" : "#f9fafb")};
  border: 2px solid ${(props) => (props.$isComplete ? "#16a34a" : "#e5e7eb")};
  border-radius: 0.5rem;
  overflow: hidden;
`;

const EquipeHeader = styled.div<{ $isComplete: boolean }>`
  background: ${(props) => (props.$isComplete ? "#16a34a" : "#6b7280")};
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EquipeNome = styled.input`
  background: transparent;
  border: none;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  width: 150px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-bottom: 1px solid white;
  }
`;

const EquipeCount = styled.span`
  font-size: 0.875rem;
  opacity: 0.9;
`;

const EquipeBody = styled.div`
  padding: 0.75rem;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const JogadorSlot = styled.div<{ $isEmpty: boolean; $genero?: string }>`
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${(props) =>
    props.$isEmpty
      ? `
    background: #f3f4f6;
    border: 2px dashed #d1d5db;
    color: #9ca3af;
    min-height: 2.5rem;
  `
      : `
    background: ${props.$genero === "feminino" ? "#fce7f3" : "#dbeafe"};
    border: 1px solid ${props.$genero === "feminino" ? "#f9a8d4" : "#93c5fd"};
    color: #374151;
  `}
`;

const JogadorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    color: #ef4444;
    background: #fee2e2;
  }
`;

const JogadoresDisponiveis = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const SectionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
`;

const JogadoresList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
`;

const JogadorChip = styled.button<{ $genero: string; $disabled?: boolean }>`
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
  transition: all 0.2s;
  border: none;

  ${(props) =>
    props.$genero === "feminino"
      ? `
    background: #fce7f3;
    color: #9d174d;
    &:hover:not(:disabled) { background: #fbcfe8; }
  `
      : `
    background: #dbeafe;
    color: #1e40af;
    &:hover:not(:disabled) { background: #bfdbfe; }
  `}
`;

const NivelBadge = styled.span<{ $nivel: string }>`
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  margin-left: 0.25rem;

  ${(props) => {
    switch (props.$nivel) {
      case "iniciante":
        return `background: #dcfce7; color: #166534;`;
      case "intermediario":
        return `background: #fef3c7; color: #92400e;`;
      case "avancado":
        return `background: #fee2e2; color: #991b1b;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant: "primary" | "secondary" }>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #059669;
    color: white;
    border: none;
    &:hover:not(:disabled) { background: #047857; }
    &:disabled { background: #9ca3af; cursor: not-allowed; }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover { background: #f9fafb; }
  `}
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 0.75rem;
  color: #991b1b;
  font-size: 0.875rem;
`;

const Spinner = styled.span`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== HELPERS ==============

const getNivelAbrev = (nivel: string): string => {
  switch (nivel) {
    case "iniciante":
      return "INI";
    case "intermediario":
      return "INT";
    case "avancado":
      return "AVA";
    default:
      return nivel.substring(0, 3).toUpperCase();
  }
};

// ============== COMPONENTE ==============

interface EquipeState {
  nome: string;
  jogadorIds: string[];
}

export const ModalFormacaoManualEquipes: React.FC<ModalFormacaoManualEquipesProps> = ({
  isOpen,
  onClose,
  onConfirm,
  inscricoes,
  varianteTeams,
  isMisto = false,
}) => {
  const jogadoresPorEquipe = varianteTeams;
  const numEquipes = Math.floor(inscricoes.length / jogadoresPorEquipe);

  // Estado das equipes
  const [equipes, setEquipes] = useState<EquipeState[]>(() =>
    Array.from({ length: numEquipes }, (_, i) => ({
      nome: `Equipe ${i + 1}`,
      jogadorIds: [],
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Jogadores já alocados
  const jogadoresAlocados = useMemo(() => {
    const ids = new Set<string>();
    equipes.forEach((eq) => eq.jogadorIds.forEach((id) => ids.add(id)));
    return ids;
  }, [equipes]);

  // Jogadores disponíveis
  const jogadoresDisponiveis = useMemo(() => {
    return inscricoes.filter(
      (i) => i.status === "confirmada" && !jogadoresAlocados.has(i.jogadorId)
    );
  }, [inscricoes, jogadoresAlocados]);

  // Mapa de inscrições por ID
  const inscricoesMap = useMemo(() => {
    const map = new Map<string, Inscricao>();
    inscricoes.forEach((i) => map.set(i.jogadorId, i));
    return map;
  }, [inscricoes]);

  // Verificar se todas equipes estão completas
  const todasCompletas = equipes.every(
    (eq) => eq.jogadorIds.length === jogadoresPorEquipe
  );

  // Adicionar jogador à equipe
  const adicionarJogador = (equipeIndex: number, jogadorId: string) => {
    setEquipes((prev) => {
      const newEquipes = [...prev];
      if (newEquipes[equipeIndex].jogadorIds.length < jogadoresPorEquipe) {
        newEquipes[equipeIndex] = {
          ...newEquipes[equipeIndex],
          jogadorIds: [...newEquipes[equipeIndex].jogadorIds, jogadorId],
        };
      }
      return newEquipes;
    });
  };

  // Remover jogador da equipe
  const removerJogador = (equipeIndex: number, jogadorId: string) => {
    setEquipes((prev) => {
      const newEquipes = [...prev];
      newEquipes[equipeIndex] = {
        ...newEquipes[equipeIndex],
        jogadorIds: newEquipes[equipeIndex].jogadorIds.filter(
          (id) => id !== jogadorId
        ),
      };
      return newEquipes;
    });
  };

  // Atualizar nome da equipe
  const atualizarNome = (equipeIndex: number, nome: string) => {
    setEquipes((prev) => {
      const newEquipes = [...prev];
      newEquipes[equipeIndex] = { ...newEquipes[equipeIndex], nome };
      return newEquipes;
    });
  };

  // Confirmar formação
  const handleConfirm = async () => {
    // Validar
    if (!todasCompletas) {
      setError("Todas as equipes devem ter " + jogadoresPorEquipe + " jogadores");
      return;
    }

    // Validar gênero para misto
    if (isMisto) {
      for (const equipe of equipes) {
        const masculinos = equipe.jogadorIds.filter(
          (id) => inscricoesMap.get(id)?.jogadorGenero === "masculino"
        ).length;
        const femininos = equipe.jogadorIds.filter(
          (id) => inscricoesMap.get(id)?.jogadorGenero === "feminino"
        ).length;

        const esperadoM = jogadoresPorEquipe / 2;
        const esperadoF = jogadoresPorEquipe / 2;

        if (masculinos !== esperadoM || femininos !== esperadoF) {
          setError(
            `${equipe.nome}: Para formato misto, cada equipe deve ter ${esperadoM} homens e ${esperadoF} mulheres`
          );
          return;
        }
      }
    }

    setError(null);
    setLoading(true);

    try {
      const formacoes: FormacaoManualEquipeDTO[] = equipes.map((eq) => ({
        nome: eq.nome,
        jogadorIds: eq.jogadorIds,
      }));

      await onConfirm(formacoes);
    } catch (err: any) {
      setError(err.message || "Erro ao formar equipes");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <Footer>
      <Button $variant="secondary" onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        $variant="primary"
        onClick={handleConfirm}
        disabled={!todasCompletas || loading}
      >
        {loading ? (
          <>
            <Spinner />
            Formando...
          </>
        ) : (
          "Formar Equipes"
        )}
      </Button>
    </Footer>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Formar Equipes Manualmente"
      size="xl"
      footer={footer}
      closeOnOverlayClick={false}
    >
      <Container>
        <InfoBox>
          <strong>
            TEAMS {varianteTeams} - {numEquipes} equipes de {jogadoresPorEquipe}{" "}
            jogadores
          </strong>
          Clique nos jogadores disponiveis para adiciona-los a uma equipe.
          {isMisto &&
            ` Cada equipe deve ter ${jogadoresPorEquipe / 2} homens e ${
              jogadoresPorEquipe / 2
            } mulheres.`}
        </InfoBox>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <EquipesContainer>
          {equipes.map((equipe, equipeIndex) => {
            const isComplete = equipe.jogadorIds.length === jogadoresPorEquipe;

            return (
              <EquipeCard key={equipeIndex} $isComplete={isComplete}>
                <EquipeHeader $isComplete={isComplete}>
                  <EquipeNome
                    value={equipe.nome}
                    onChange={(e) => atualizarNome(equipeIndex, e.target.value)}
                    placeholder="Nome da equipe"
                  />
                  <EquipeCount>
                    {equipe.jogadorIds.length}/{jogadoresPorEquipe}
                  </EquipeCount>
                </EquipeHeader>

                <EquipeBody>
                  {/* Slots preenchidos */}
                  {equipe.jogadorIds.map((jogadorId) => {
                    const inscricao = inscricoesMap.get(jogadorId);
                    return (
                      <JogadorSlot
                        key={jogadorId}
                        $isEmpty={false}
                        $genero={inscricao?.jogadorGenero}
                      >
                        <JogadorInfo>
                          <span>{inscricao?.jogadorNome}</span>
                          {inscricao?.jogadorNivel && (
                            <NivelBadge $nivel={inscricao.jogadorNivel}>
                              {getNivelAbrev(inscricao.jogadorNivel)}
                            </NivelBadge>
                          )}
                        </JogadorInfo>
                        <RemoveButton
                          onClick={() => removerJogador(equipeIndex, jogadorId)}
                          title="Remover jogador"
                        >
                          X
                        </RemoveButton>
                      </JogadorSlot>
                    );
                  })}

                  {/* Slots vazios */}
                  {Array.from({
                    length: jogadoresPorEquipe - equipe.jogadorIds.length,
                  }).map((_, i) => (
                    <JogadorSlot key={`empty-${i}`} $isEmpty={true}>
                      Clique em um jogador para adicionar
                    </JogadorSlot>
                  ))}
                </EquipeBody>
              </EquipeCard>
            );
          })}
        </EquipesContainer>

        <JogadoresDisponiveis>
          <SectionTitle>
            Jogadores Disponiveis ({jogadoresDisponiveis.length})
          </SectionTitle>
          <JogadoresList>
            {jogadoresDisponiveis.length === 0 ? (
              <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                Todos os jogadores foram alocados
              </span>
            ) : (
              jogadoresDisponiveis.map((inscricao) => {
                // Encontrar primeira equipe incompleta para adicionar
                const equipeIncompleta = equipes.findIndex(
                  (eq) => eq.jogadorIds.length < jogadoresPorEquipe
                );

                return (
                  <JogadorChip
                    key={inscricao.jogadorId}
                    $genero={inscricao.jogadorGenero}
                    $disabled={equipeIncompleta === -1}
                    onClick={() => {
                      if (equipeIncompleta !== -1) {
                        adicionarJogador(equipeIncompleta, inscricao.jogadorId);
                      }
                    }}
                    disabled={equipeIncompleta === -1}
                  >
                    {inscricao.jogadorNome}
                    {inscricao.jogadorNivel && (
                      <NivelBadge $nivel={inscricao.jogadorNivel}>
                        {getNivelAbrev(inscricao.jogadorNivel)}
                      </NivelBadge>
                    )}
                  </JogadorChip>
                );
              })
            )}
          </JogadoresList>
        </JogadoresDisponiveis>
      </Container>
    </Modal>
  );
};

export default ModalFormacaoManualEquipes;
