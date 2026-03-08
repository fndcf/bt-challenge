/**
 * Tab para formação manual de duplas no formato DUPLA FIXA
 * Baseado no ModalFormacaoManualEquipes (TEAMS)
 */

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { Inscricao } from "@/types/etapa";

interface DuplasManuaisTabProps {
  inscricoes: Inscricao[];
  isMisto?: boolean;
  onConfirm: (
    formacoes: { jogador1Id: string; jogador2Id: string }[]
  ) => Promise<void>;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
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

const DuplasContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DuplaCard = styled.div<{ $isComplete: boolean }>`
  flex: 1;
  min-width: 250px;
  max-width: 320px;
  background: ${(props) => (props.$isComplete ? "#dcfce7" : "#f9fafb")};
  border: 2px solid ${(props) => (props.$isComplete ? "#16a34a" : "#e5e7eb")};
  border-radius: 0.5rem;
  overflow: hidden;
`;

const DuplaHeader = styled.div<{ $isComplete: boolean }>`
  background: ${(props) => (props.$isComplete ? "#16a34a" : "#6b7280")};
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 0.875rem;
`;

const DuplaCount = styled.span`
  font-size: 0.8125rem;
  opacity: 0.9;
`;

const DuplaBody = styled.div`
  padding: 0.75rem;
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

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
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

interface DuplaState {
  jogadorIds: string[];
}

export const DuplasManuaisTab: React.FC<DuplasManuaisTabProps> = ({
  inscricoes,
  isMisto = false,
  onConfirm,
}) => {
  const inscricoesConfirmadas = useMemo(
    () => inscricoes.filter((i) => i.status === "confirmada"),
    [inscricoes]
  );

  const numDuplas = Math.floor(inscricoesConfirmadas.length / 2);

  const [duplas, setDuplas] = useState<DuplaState[]>(() =>
    Array.from({ length: numDuplas }, () => ({
      jogadorIds: [],
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jogadoresAlocados = useMemo(() => {
    const ids = new Set<string>();
    duplas.forEach((d) => d.jogadorIds.forEach((id) => ids.add(id)));
    return ids;
  }, [duplas]);

  const jogadoresDisponiveis = useMemo(() => {
    return inscricoesConfirmadas.filter(
      (i) => !jogadoresAlocados.has(i.jogadorId)
    );
  }, [inscricoesConfirmadas, jogadoresAlocados]);

  const inscricoesMap = useMemo(() => {
    const map = new Map<string, Inscricao>();
    inscricoesConfirmadas.forEach((i) => map.set(i.jogadorId, i));
    return map;
  }, [inscricoesConfirmadas]);

  const todasCompletas = duplas.every((d) => d.jogadorIds.length === 2);

  const adicionarJogador = (duplaIndex: number, jogadorId: string) => {
    setDuplas((prev) => {
      const newDuplas = [...prev];
      if (newDuplas[duplaIndex].jogadorIds.length < 2) {
        newDuplas[duplaIndex] = {
          ...newDuplas[duplaIndex],
          jogadorIds: [...newDuplas[duplaIndex].jogadorIds, jogadorId],
        };
      }
      return newDuplas;
    });
    setError(null);
  };

  const removerJogador = (duplaIndex: number, jogadorId: string) => {
    setDuplas((prev) => {
      const newDuplas = [...prev];
      newDuplas[duplaIndex] = {
        ...newDuplas[duplaIndex],
        jogadorIds: newDuplas[duplaIndex].jogadorIds.filter(
          (id) => id !== jogadorId
        ),
      };
      return newDuplas;
    });
  };

  const limparTudo = () => {
    setDuplas(
      Array.from({ length: numDuplas }, () => ({
        jogadorIds: [],
      }))
    );
    setError(null);
  };

  const handleConfirm = async () => {
    if (!todasCompletas) {
      setError("Todas as duplas devem ter 2 jogadores");
      return;
    }

    if (isMisto) {
      for (let i = 0; i < duplas.length; i++) {
        const dupla = duplas[i];
        const j1 = inscricoesMap.get(dupla.jogadorIds[0]);
        const j2 = inscricoesMap.get(dupla.jogadorIds[1]);
        if (j1 && j2 && j1.jogadorGenero === j2.jogadorGenero) {
          setError(
            `Dupla ${i + 1}: etapa mista requer 1 masculino + 1 feminino por dupla`
          );
          return;
        }
      }
    }

    setError(null);
    setLoading(true);

    try {
      const formacoes = duplas.map((d) => ({
        jogador1Id: d.jogadorIds[0],
        jogador2Id: d.jogadorIds[1],
      }));

      await onConfirm(formacoes);
    } catch (err: any) {
      setError(err.message || "Erro ao formar duplas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <InfoBox>
        <strong>
          Formacao Manual - {numDuplas} duplas de 2 jogadores
        </strong>
        Clique nos jogadores disponiveis para adiciona-los a uma dupla.
        {isMisto &&
          " Cada dupla deve ter 1 jogador masculino e 1 feminino."}
      </InfoBox>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <DuplasContainer>
        {duplas.map((dupla, duplaIndex) => {
          const isComplete = dupla.jogadorIds.length === 2;

          return (
            <DuplaCard key={duplaIndex} $isComplete={isComplete}>
              <DuplaHeader $isComplete={isComplete}>
                <span>Dupla {duplaIndex + 1}</span>
                <DuplaCount>{dupla.jogadorIds.length}/2</DuplaCount>
              </DuplaHeader>

              <DuplaBody>
                {dupla.jogadorIds.map((jogadorId) => {
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
                        onClick={() => removerJogador(duplaIndex, jogadorId)}
                        title="Remover jogador"
                      >
                        X
                      </RemoveButton>
                    </JogadorSlot>
                  );
                })}

                {Array.from({
                  length: 2 - dupla.jogadorIds.length,
                }).map((_, i) => (
                  <JogadorSlot key={`empty-${i}`} $isEmpty={true}>
                    Clique em um jogador para adicionar
                  </JogadorSlot>
                ))}
              </DuplaBody>
            </DuplaCard>
          );
        })}
      </DuplasContainer>

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
              const duplaIncompleta = duplas.findIndex(
                (d) => d.jogadorIds.length < 2
              );

              return (
                <JogadorChip
                  key={inscricao.jogadorId}
                  $genero={inscricao.jogadorGenero}
                  $disabled={duplaIncompleta === -1}
                  onClick={() => {
                    if (duplaIncompleta !== -1) {
                      adicionarJogador(duplaIncompleta, inscricao.jogadorId);
                    }
                  }}
                  disabled={duplaIncompleta === -1}
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

      <FooterActions>
        <Button $variant="secondary" onClick={limparTudo} disabled={loading}>
          Limpar Tudo
        </Button>
        <Button
          $variant="primary"
          onClick={handleConfirm}
          disabled={!todasCompletas || loading}
        >
          {loading ? (
            <>
              <Spinner />
              Gerando...
            </>
          ) : (
            "Confirmar Duplas e Gerar Chaves"
          )}
        </Button>
      </FooterActions>
    </Container>
  );
};

export default DuplasManuaisTab;
