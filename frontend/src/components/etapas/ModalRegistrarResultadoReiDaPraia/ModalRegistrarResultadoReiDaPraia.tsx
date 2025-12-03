/**
 * ModalRegistrarResultadoReiDaPraia - Modal para registrar resultado de partida Rei da Praia
 *
 * Diferenças do Dupla Fixa:
 * - Mostra os 4 jogadores individuais (2 vs 2)
 * - Apenas 1 set por partida
 * - Vencedores são os 2 jogadores da dupla vencedora
 * - Visual roxo
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";
import reiDaPraiaService from "@/services/reiDaPraiaService";

interface ModalRegistrarResultadoReiDaPraiaProps {
  partida: PartidaReiDaPraia;
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
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 32rem;
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
  color: #581c87;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

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
  gap: 1.5rem;
`;

// ============== DUPLAS BOX ==============

const DuplasContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DuplaBox = styled.div<{ $isWinner?: boolean }>`
  background: ${(props) => (props.$isWinner ? "#f0fdf4" : "#faf5ff")};
  border: 2px solid ${(props) => (props.$isWinner ? "#86efac" : "#e9d5ff")};
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s;
`;

const DuplaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const DuplaLabel = styled.span<{ $isWinner?: boolean }>`
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => (props.$isWinner ? "#166534" : "#7c3aed")};
`;

const DuplaNome = styled.span<{ $isWinner?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => (props.$isWinner ? "#16a34a" : "#9333ea")};
  background: ${(props) => (props.$isWinner ? "#dcfce7" : "#ede9fe")};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
`;

const JogadoresRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const JogadorNome = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 600 : 500)};
  color: ${(props) => (props.$isWinner ? "#166534" : "#374151")};
  font-size: 0.9375rem;
`;

const JogadorSeparator = styled.span`
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.875rem;
`;

const VsSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 0.75rem;
    color: #7c3aed;
    font-weight: 700;
    background: #ede9fe;
    padding: 0.25rem 1rem;
    border-radius: 9999px;
  }
`;

// ============== PLACAR SECTION ==============

const PlacarSection = styled.div`
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 1.25rem;
`;

const PlacarTitle = styled.h4`
  font-weight: 700;
  color: #581c87;
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;
  text-align: center;
`;

const PlacarGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
`;

const InputGroup = styled.div`
  text-align: center;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  color: #7c3aed;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const ScoreInput = styled.input`
  width: 100%;
  max-width: 80px;
  margin: 0 auto;
  display: block;
  border: 2px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #581c87;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #d1d5db;
  }
`;

const PlacarSeparator = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #7c3aed;
`;

// ============== RESULT BOX ==============

const ResultBox = styled.div`
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 2px solid #86efac;
  border-radius: 0.5rem;
  padding: 1.25rem;
  text-align: center;
`;

const ResultLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #166534;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const WinnerIcon = styled.div`
  font-size: 2rem;
  margin: 0.5rem 0;
`;

const WinnerNames = styled.p`
  font-size: 1.125rem;
  font-weight: 700;
  color: #166534;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const ResultScore = styled.p`
  font-size: 0.875rem;
  color: #16a34a;
  margin: 0.5rem 0 0 0;
  font-weight: 600;
`;

const PointsInfo = styled.p`
  font-size: 0.75rem;
  color: #15803d;
  margin: 0.5rem 0 0 0;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  display: inline-block;
`;

// ============== ERROR & BUTTONS ==============

const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: #991b1b;
  margin: 0;
  text-align: center;
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
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
    &:hover:not(:disabled) { 
      background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
    }
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

// ============== HINTS ==============

const HintsBox = styled.div`
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const HintsTitle = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  color: #7c3aed;
  margin: 0 0 0.5rem 0;
`;

const HintsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;

    strong {
      color: #7c3aed;
    }
  }
`;

// ============== COMPONENTE ==============

export const ModalRegistrarResultadoReiDaPraia: React.FC<
  ModalRegistrarResultadoReiDaPraiaProps
> = ({ partida, onClose, onSuccess }) => {
  const isEdicao = partida.status === "finalizada";

  const [gamesDupla1, setGamesDupla1] = useState<number | undefined>(undefined);
  const [gamesDupla2, setGamesDupla2] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar dados se for edição
  useEffect(() => {
    if (isEdicao && partida.placar && partida.placar.length > 0) {
      setGamesDupla1(partida.placar[0].gamesDupla1);
      setGamesDupla2(partida.placar[0].gamesDupla2);
    }
  }, [isEdicao, partida.placar]);

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
        vencedores: `${partida.jogador1ANome} & ${partida.jogador1BNome}`,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
        isDupla1: true,
      };
    } else if (gamesDupla2 > gamesDupla1) {
      return {
        vencedores: `${partida.jogador2ANome} & ${partida.jogador2BNome}`,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
        isDupla1: false,
      };
    }
    return null;
  };

  const validarPlacar = (): boolean => {
    setErro(null);

    if (gamesDupla1 === undefined && gamesDupla2 === undefined) {
      setErro("Preencha o placar da partida");
      return false;
    }

    if (gamesDupla1 === undefined) {
      setErro("Preencha o placar da Dupla 1");
      return false;
    }

    if (gamesDupla2 === undefined) {
      setErro("Preencha o placar da Dupla 2");
      return false;
    }

    if (gamesDupla1 === 0 && gamesDupla2 === 0) {
      setErro("O placar não pode ser 0 x 0");
      return false;
    }

    const maxGames = Math.max(gamesDupla1, gamesDupla2);
    const minGames = Math.min(gamesDupla1, gamesDupla2);

    // Validação de placar de tênis/beach tennis
    if (maxGames < 6) {
      setErro("O set deve ter no mínimo 6 games para o vencedor");
      return false;
    }

    if (maxGames === 6 && minGames > 4) {
      setErro("Set 6-X: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4");
      return false;
    }

    if (maxGames === 7 && minGames < 5) {
      setErro("Set 7-X: placar deve ser 7-5 ou 7-6 (tiebreak)");
      return false;
    }

    if (maxGames > 7) {
      setErro("Set não pode ter mais de 7 games");
      return false;
    }

    if (gamesDupla1 === gamesDupla2) {
      setErro("Não pode haver empate. Deve haver um vencedor!");
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

      await reiDaPraiaService.registrarResultado(partida.etapaId, partida.id, [
        {
          numero: 1,
          gamesDupla1: gamesDupla1!,
          gamesDupla2: gamesDupla2!,
        },
      ]);

      alert(
        isEdicao
          ? "✅ Resultado atualizado com sucesso!"
          : "✅ Resultado registrado com sucesso!\n\n" +
              "Os pontos foram atribuídos aos jogadores vencedores."
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
              <span>👑</span>
              {isEdicao ? "Editar Resultado" : "Registrar Resultado"}
            </Title>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </Header>

          <Form onSubmit={handleSubmit}>
            {/* Duplas */}
            <DuplasContainer>
              {/* Dupla 1 */}
              <DuplaBox $isWinner={resultado?.isDupla1 ?? false}>
                <DuplaHeader>
                  <DuplaLabel $isWinner={resultado?.isDupla1 ?? false}>
                    Dupla 1
                  </DuplaLabel>
                  {partida.dupla1Nome && (
                    <DuplaNome $isWinner={resultado?.isDupla1 ?? false}>
                      {partida.dupla1Nome}
                    </DuplaNome>
                  )}
                </DuplaHeader>
                <JogadoresRow>
                  <JogadorNome $isWinner={resultado?.isDupla1 ?? false}>
                    {partida.jogador1ANome}
                  </JogadorNome>
                  <JogadorSeparator>&</JogadorSeparator>
                  <JogadorNome $isWinner={resultado?.isDupla1 ?? false}>
                    {partida.jogador1BNome}
                  </JogadorNome>
                </JogadoresRow>
              </DuplaBox>

              <VsSeparator>
                <span>VS</span>
              </VsSeparator>

              {/* Dupla 2 */}
              <DuplaBox $isWinner={resultado ? !resultado.isDupla1 : false}>
                <DuplaHeader>
                  <DuplaLabel
                    $isWinner={resultado ? !resultado.isDupla1 : false}
                  >
                    Dupla 2
                  </DuplaLabel>
                  {partida.dupla2Nome && (
                    <DuplaNome
                      $isWinner={resultado ? !resultado.isDupla1 : false}
                    >
                      {partida.dupla2Nome}
                    </DuplaNome>
                  )}
                </DuplaHeader>
                <JogadoresRow>
                  <JogadorNome
                    $isWinner={resultado ? !resultado.isDupla1 : false}
                  >
                    {partida.jogador2ANome}
                  </JogadorNome>
                  <JogadorSeparator>&</JogadorSeparator>
                  <JogadorNome
                    $isWinner={resultado ? !resultado.isDupla1 : false}
                  >
                    {partida.jogador2BNome}
                  </JogadorNome>
                </JogadoresRow>
              </DuplaBox>
            </DuplasContainer>

            {/* Placar */}
            <PlacarSection>
              <PlacarTitle>🎾 Placar do Set</PlacarTitle>

              <PlacarGrid>
                <InputGroup>
                  <InputLabel>Dupla 1</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="7"
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
                    autoFocus
                  />
                </InputGroup>

                <PlacarSeparator>×</PlacarSeparator>

                <InputGroup>
                  <InputLabel>Dupla 2</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="7"
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

            {/* Resultado */}
            {resultado && (
              <ResultBox>
                <ResultLabel>🏆 Vencedores</ResultLabel>
                <WinnerIcon>🎉</WinnerIcon>
                <WinnerNames>{resultado.vencedores}</WinnerNames>
                <ResultScore>Placar: {resultado.placar}</ResultScore>
                <PointsInfo>+3 pontos para cada jogador</PointsInfo>
              </ResultBox>
            )}

            {/* Erro */}
            {erro && (
              <ErrorBox>
                <ErrorText>❌ {erro}</ErrorText>
              </ErrorBox>
            )}

            {/* Botões */}
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
                      {isEdicao ? "✓ Atualizar" : "✓ Salvar Resultado"}
                    </span>
                  </>
                )}
              </Button>
            </ButtonsRow>

            {/* Dicas */}
            <HintsBox>
              <HintsTitle>📋 Regras do Rei da Praia</HintsTitle>
              <HintsList>
                <p>
                  <strong>Formato:</strong> Apenas 1 set por partida
                </p>
                <p>
                  <strong>Placares válidos:</strong> 6-0, 6-1, 6-2, 6-3, 6-4,
                  7-5, 7-6
                </p>
                <p>
                  <strong>Pontuação:</strong> Cada jogador vencedor ganha 3
                  pontos
                </p>
              </HintsList>
            </HintsBox>
          </Form>
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalRegistrarResultadoReiDaPraia;
