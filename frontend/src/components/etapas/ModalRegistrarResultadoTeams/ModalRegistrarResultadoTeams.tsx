import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import { PartidaTeams, SetPlacarTeams, StatusPartidaTeams } from "@/types/teams";

interface ModalRegistrarResultadoTeamsProps {
  etapaId: string;
  partida: PartidaTeams;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DuplasBox = styled.div`
  margin-bottom: 1.5rem;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
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

const DuplaBox = styled.div`
  text-align: center;
`;

const DuplaNome = styled.span`
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
  display: block;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const EquipeLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
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
    border-color: #059669;
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
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
    background: #059669;
    color: white;
    &:hover:not(:disabled) { background: #047857; }
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

export const ModalRegistrarResultadoTeams: React.FC<
  ModalRegistrarResultadoTeamsProps
> = ({ etapaId, partida, onClose, onSuccess }) => {
  const teamsService = getTeamsService();
  const isEdicao = partida.status === StatusPartidaTeams.FINALIZADA;

  const [set, setSet] = useState<SetPlacarTeams>({
    numero: 1,
    gamesDupla1: undefined as any,
    gamesDupla2: undefined as any,
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar dados se for edicao
  useEffect(() => {
    if (isEdicao && partida.placar && partida.placar.length > 0) {
      setSet({
        numero: 1,
        gamesDupla1: partida.placar[0].gamesDupla1,
        gamesDupla2: partida.placar[0].gamesDupla2,
      });
    }
  }, [isEdicao, partida.placar]);

  const handleSetChange = (
    campo: "gamesDupla1" | "gamesDupla2",
    valor: string
  ) => {
    const valorNumerico = valor === "" ? undefined : parseInt(valor);
    setSet({
      ...set,
      [campo]: valorNumerico,
    });
  };

  const calcularVencedor = () => {
    if (
      set.gamesDupla1 === undefined ||
      set.gamesDupla1 === null ||
      set.gamesDupla2 === undefined ||
      set.gamesDupla2 === null
    ) {
      return null;
    }

    if (set.gamesDupla1 > set.gamesDupla2) {
      return {
        vencedor: `${partida.dupla1[0]?.nome} & ${partida.dupla1[1]?.nome}`,
        equipe: partida.equipe1Nome || "",
        placar: `${set.gamesDupla1} x ${set.gamesDupla2}`,
      };
    } else if (set.gamesDupla2 > set.gamesDupla1) {
      return {
        vencedor: `${partida.dupla2[0]?.nome} & ${partida.dupla2[1]?.nome}`,
        equipe: partida.equipe2Nome || "",
        placar: `${set.gamesDupla1} x ${set.gamesDupla2}`,
      };
    }
    return null;
  };

  const validarPlacar = (): boolean => {
    if (
      (set.gamesDupla1 === undefined || set.gamesDupla1 === null) &&
      (set.gamesDupla2 === undefined || set.gamesDupla2 === null)
    ) {
      setErro("O placar deve ser preenchido");
      return false;
    }

    if (set.gamesDupla1 === undefined || set.gamesDupla1 === null) {
      setErro("Preencha o placar da primeira dupla");
      return false;
    }

    if (set.gamesDupla2 === undefined || set.gamesDupla2 === null) {
      setErro("Preencha o placar da segunda dupla");
      return false;
    }

    if (set.gamesDupla1 === 0 && set.gamesDupla2 === 0) {
      setErro("O placar nao pode ser 0 x 0");
      return false;
    }

    const maxGames = Math.max(set.gamesDupla1, set.gamesDupla2);
    const minGames = Math.min(set.gamesDupla1, set.gamesDupla2);

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
      await teamsService.registrarResultado(etapaId, partida.id, [set]);
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

  const dupla1Nome = `${partida.dupla1[0]?.nome} & ${partida.dupla1[1]?.nome}`;
  const dupla2Nome = `${partida.dupla2[0]?.nome} & ${partida.dupla2[1]?.nome}`;

  return (
    <Overlay>
      <OverlayBackground onClick={!loading ? onClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          <Header>
            <Title>
              {isEdicao ? "Editar Resultado" : "Registrar Resultado"}
            </Title>
            <CloseButton onClick={onClose} disabled={loading}>✕</CloseButton>
          </Header>

          <DuplasBox>
            <DuplasContent>
              <DuplaBox>
                <DuplaNome>{dupla1Nome}</DuplaNome>
                <EquipeLabel>{partida.equipe1Nome}</EquipeLabel>
              </DuplaBox>

              <VsSeparator>VS</VsSeparator>

              <DuplaBox>
                <DuplaNome>{dupla2Nome}</DuplaNome>
                <EquipeLabel>{partida.equipe2Nome}</EquipeLabel>
              </DuplaBox>
            </DuplasContent>
          </DuplasBox>

          <Form onSubmit={handleSubmit}>
            <PlacarSection>
              <PlacarTitle>Placar</PlacarTitle>

              <PlacarGrid>
                <InputGroup>
                  <InputLabel>{dupla1Nome}</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="10"
                    value={set.gamesDupla1 ?? ""}
                    onChange={(e) =>
                      handleSetChange("gamesDupla1", e.target.value)
                    }
                    placeholder="0"
                    required
                    disabled={loading}
                  />
                </InputGroup>

                <InputGroup>
                  <InputLabel>{dupla2Nome}</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="10"
                    value={set.gamesDupla2 ?? ""}
                    onChange={(e) =>
                      handleSetChange("gamesDupla2", e.target.value)
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
                  <span>
                    {isEdicao ? "Atualizar Resultado" : "Salvar Resultado"}
                  </span>
                )}
              </Button>
            </ButtonsRow>
          </Form>
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalRegistrarResultadoTeams;
