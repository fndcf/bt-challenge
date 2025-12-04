import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
} from "@/types/chave";
import { getChaveService } from "@/services";

interface ModalRegistrarResultadoEliminatorioProps {
  confronto: ConfrontoEliminatorio;
  onClose: () => void;
  onSuccess: () => void;
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
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  position: relative;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 42rem;
  width: 100%;
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const CloseButton = styled.button`
  color: #9ca3af;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: #4b5563;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InfoBox = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 0.5rem;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #1d4ed8;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
  font-size: 0.75rem;
  color: #2563eb;
`;

const PlacarSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
`;

const PlacarGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const InputGroup = styled.div``;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const ScoreInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  text-align: center;
  font-size: 1.125rem;
  font-weight: 700;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #d1d5db;
  }
`;

const ResultBox = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 0.5rem;
`;

const ResultLabel = styled.div`
  font-size: 0.875rem;
  color: #166534;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const WinnerName = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #166534;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const ResultScore = styled.div`
  font-size: 0.875rem;
  color: #16a34a;
  margin-top: 0.25rem;
`;

const ErrorBox = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
  font-size: 0.875rem;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #2563eb;
    color: white;
    &:hover:not(:disabled) { background: #1d4ed8; }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover:not(:disabled) { background: #f9fafb; }
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

const WarningBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
`;

const WarningText = styled.div`
  font-size: 0.75rem;
  color: #92400e;

  strong {
    font-weight: 600;
  }
`;

// ============== COMPONENTE ==============

export const ModalRegistrarResultadoEliminatorio: React.FC<
  ModalRegistrarResultadoEliminatorioProps
> = ({ confronto, onClose, onSuccess }) => {
  const chaveService = getChaveService();
  const isEdicao = confronto.status === StatusConfrontoEliminatorio.FINALIZADA;

  const [gamesDupla1, setGamesDupla1] = useState<number | undefined>(undefined);
  const [gamesDupla2, setGamesDupla2] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isEdicao && confronto.placar) {
      const [g1, g2] = confronto.placar.split("-").map(Number);
      setGamesDupla1(g1);
      setGamesDupla2(g2);
    }
  }, [isEdicao, confronto.placar]);

  const calcularVencedor = () => {
    if (
      gamesDupla1 === undefined ||
      gamesDupla1 === null ||
      gamesDupla2 === undefined ||
      gamesDupla2 === null
    ) {
      return null;
    }

    if (gamesDupla1 > gamesDupla2) {
      return {
        vencedor: confronto.dupla1Nome!,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
      };
    } else if (gamesDupla2 > gamesDupla1) {
      return {
        vencedor: confronto.dupla2Nome!,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
      };
    }
    return null;
  };

  const validarPlacar = (): boolean => {
    if (
      (gamesDupla1 === undefined || gamesDupla1 === null) &&
      (gamesDupla2 === undefined || gamesDupla2 === null)
    ) {
      setErro("O placar deve ser preenchido");
      return false;
    }

    if (gamesDupla1 === undefined || gamesDupla1 === null) {
      setErro("Preencha o placar da primeira dupla");
      return false;
    }

    if (gamesDupla2 === undefined || gamesDupla2 === null) {
      setErro("Preencha o placar da segunda dupla");
      return false;
    }

    if (gamesDupla1 === 0 && gamesDupla2 === 0) {
      setErro("O placar não pode ser 0 x 0");
      return false;
    }

    const maxGames = Math.max(gamesDupla1, gamesDupla2);
    const minGames = Math.min(gamesDupla1, gamesDupla2);

    if (maxGames < 6) {
      setErro("O set deve ter no mínimo 6 games para o vencedor");
      return false;
    }

    if (maxGames === 6 && minGames > 4) {
      setErro("Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4");
      return false;
    }

    if (maxGames === 7 && minGames < 5) {
      setErro("Set com 7 games: placar deve ser 7-5 ou 7-6");
      return false;
    }

    if (maxGames > 7) {
      setErro("Set não pode ter mais de 7 games");
      return false;
    }

    const resultado = calcularVencedor();
    if (!resultado) {
      setErro("Não há um vencedor definido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!validarPlacar()) {
      return;
    }

    try {
      setLoading(true);
      await chaveService.registrarResultadoEliminatorio(confronto.id, [
        {
          numero: 1,
          gamesDupla1: gamesDupla1!,
          gamesDupla2: gamesDupla2!,
        },
      ]);
      alert(
        isEdicao
          ? " Resultado atualizado com sucesso!"
          : " Resultado registrado com sucesso!"
      );
      onSuccess();
    } catch (err: any) {
      setErro(
        err.message ||
          `Erro ao ${isEdicao ? "atualizar" : "registrar"} resultado`
      );
    } finally {
      setLoading(false);
    }
  };

  const resultado = calcularVencedor();

  return (
    <Overlay>
      <OverlayBackground onClick={onClose} />

      <ModalWrapper>
        <ModalContainer>
          <Header>
            <Title>
              {isEdicao ? " Editar Resultado" : " Registrar Resultado"}
            </Title>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </Header>

          <Form onSubmit={handleSubmit}>
            <InfoBox>
              <InfoLabel>Confronto Eliminatório</InfoLabel>
              <InfoText>
                {confronto.dupla1Origem} vs {confronto.dupla2Origem}
              </InfoText>
            </InfoBox>

            <PlacarSection>
              <SectionLabel>Placar do Set</SectionLabel>

              <PlacarGrid>
                <InputGroup>
                  <InputLabel>{confronto.dupla1Nome}</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="10"
                    value={gamesDupla1 ?? ""}
                    onChange={(e) =>
                      setGamesDupla1(
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value)
                      )
                    }
                    placeholder="0"
                    required
                    disabled={loading}
                  />
                </InputGroup>

                <InputGroup>
                  <InputLabel>{confronto.dupla2Nome}</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="10"
                    value={gamesDupla2 ?? ""}
                    onChange={(e) =>
                      setGamesDupla2(
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value)
                      )
                    }
                    placeholder="0"
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </PlacarGrid>
            </PlacarSection>

            {resultado && (
              <ResultBox>
                <ResultLabel>Vencedor</ResultLabel>
                <WinnerName>{resultado.vencedor}</WinnerName>
                <ResultScore>Placar: {resultado.placar}</ResultScore>
              </ResultBox>
            )}

            {erro && <ErrorBox>❌ {erro}</ErrorBox>}

            <ButtonsRow>
              <Button
                type="button"
                $variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                $variant="primary"
                disabled={loading || !resultado}
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>{isEdicao ? "Atualizando..." : "Salvando..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isEdicao ? "Atualizar Resultado" : "Salvar Resultado"}
                    </span>
                  </>
                )}
              </Button>
            </ButtonsRow>
          </Form>

          <WarningBox>
            <WarningText>
              <strong>Importante:</strong> O vencedor avançará automaticamente
              para a próxima fase!
            </WarningText>
          </WarningBox>
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalRegistrarResultadoEliminatorio;
