import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";
import { getSuperXService } from "@/services";

interface ModalRegistrarResultadoSuperXProps {
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
  color: #581c87;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DuplasBox = styled.div`
  margin-bottom: 1.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const DuplasContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DuplaNome = styled.span`
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const VsSeparator = styled.span`
  color: #9ca3af;
  font-weight: 700;
  font-size: 0.875rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PlacarSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const PlacarTitle = styled.h4`
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const PlacarGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: end;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  min-height: 2.5rem;
  display: flex;
  align-items: flex-end;
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

const ErrorBox = styled.div`
  margin-top: 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: #991b1b;
  margin: 0;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
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
    background: #7c3aed;
    color: white;
    &:hover:not(:disabled) { background: #6d28d9; }
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

// ============== COMPONENTE ==============

export const ModalRegistrarResultadoSuperX: React.FC<
  ModalRegistrarResultadoSuperXProps
> = ({ partida, onClose, onSuccess }) => {
  const superXService = getSuperXService();
  const isEdicao = partida.status === "finalizada";

  const [gamesDupla1, setGamesDupla1] = useState<number | undefined>(undefined);
  const [gamesDupla2, setGamesDupla2] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar dados se for edicao
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
        vencedor: `${partida.jogador1ANome} & ${partida.jogador1BNome}`,
        placar: `${gamesDupla1} x ${gamesDupla2}`,
      };
    } else if (gamesDupla2 > gamesDupla1) {
      return {
        vencedor: `${partida.jogador2ANome} & ${partida.jogador2BNome}`,
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
      setErro("O placar nao pode ser 0 x 0");
      return false;
    }

    const maxGames = Math.max(gamesDupla1, gamesDupla2);
    const minGames = Math.min(gamesDupla1, gamesDupla2);

    if (maxGames < 4) {
      setErro("O set deve ter no minimo 4 games para o vencedor");
      return false;
    }

    if (maxGames === 4 && minGames > 2) {
      setErro("Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2");
      return false;
    }

    if (maxGames === 5 && minGames < 3) {
      setErro("Set com 5 games: placar deve ser 5-3 ou 5-4");
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
      setErro("Set nao pode ter mais de 7 games");
      return false;
    }

    const resultado = calcularVencedor();
    if (!resultado) {
      setErro("Nao ha um vencedor definido");
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
      await superXService.registrarResultado(partida.etapaId, partida.id, [
        {
          numero: 1,
          gamesDupla1: gamesDupla1!,
          gamesDupla2: gamesDupla2!,
        },
      ]);
      alert(
        isEdicao
          ? "Resultado atualizado com sucesso!"
          : "Resultado registrado com sucesso!"
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
      <OverlayBackground onClick={!loading ? onClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          <Header>
            <Title>
              {isEdicao ? "Editar Resultado" : "Registrar Resultado"} - Super X
            </Title>
            <CloseButton onClick={onClose} disabled={loading}>x</CloseButton>
          </Header>

          <DuplasBox>
            <DuplasContent>
              <DuplaNome>
                {partida.jogador1ANome} & {partida.jogador1BNome}
              </DuplaNome>
              <VsSeparator>VS</VsSeparator>
              <DuplaNome>
                {partida.jogador2ANome} & {partida.jogador2BNome}
              </DuplaNome>
            </DuplasContent>
          </DuplasBox>

          <Form onSubmit={handleSubmit}>
            <PlacarSection>
              <PlacarTitle>Placar (1 Set)</PlacarTitle>

              <PlacarGrid>
                <InputGroup>
                  <InputLabel>
                    {partida.jogador1ANome} & {partida.jogador1BNome}
                  </InputLabel>
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
                  <InputLabel>
                    {partida.jogador2ANome} & {partida.jogador2BNome}
                  </InputLabel>
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

            {erro && (
              <ErrorBox>
                <ErrorText>{erro}</ErrorText>
              </ErrorBox>
            )}

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
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalRegistrarResultadoSuperX;
