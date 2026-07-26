import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
} from "@/types/chave";
import { getChaveService } from "@/services";
import {
  SetScore,
  venceuSet,
  setVazio,
  deveExibirTerceiroSet,
  validarSet,
  montarPlacarFinal,
  parsePlacarConfronto,
} from "@/utils/placarMelhorDe3";

interface ModalRegistrarResultadoEliminatorioProps {
  confronto: ConfrontoEliminatorio;
  melhorDe3?: boolean;
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
  align-items: end;
  margin-bottom: 0.75rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const SetLabelHeader = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.375rem;
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

// ============== COMPONENTE ==============

export const ModalRegistrarResultadoEliminatorio: React.FC<
  ModalRegistrarResultadoEliminatorioProps
> = ({ confronto, melhorDe3 = false, onClose, onSuccess }) => {
  const chaveService = getChaveService();
  const isEdicao = confronto.status === StatusConfrontoEliminatorio.FINALIZADA;

  const [set1, setSet1] = useState<SetScore>({});
  const [set2, setSet2] = useState<SetScore>({});
  const [set3, setSet3] = useState<SetScore>({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isEdicao && confronto.placar) {
      const sets = parsePlacarConfronto(confronto.placar);
      setSet1(sets[0] || {});
      setSet2(sets[1] || {});
      setSet3(sets[2] || {});
    }
  }, [isEdicao, confronto.placar]);

  const mostrarTerceiroSet = melhorDe3 && deveExibirTerceiroSet(set1, set2);

  const calcularVencedor = (): { vencedor: string; placar: string } | null => {
    const formatarSet = (set: SetScore) => `${set.gamesDupla1} x ${set.gamesDupla2}`;

    const vencedorSet1 = venceuSet(set1);
    if (vencedorSet1 === undefined) return null;

    if (!melhorDe3) {
      return {
        vencedor: vencedorSet1 === 1 ? confronto.dupla1Nome! : confronto.dupla2Nome!,
        placar: formatarSet(set1),
      };
    }

    const vencedorSet2 = venceuSet(set2);
    if (vencedorSet2 === undefined) return null;

    if (vencedorSet1 === vencedorSet2) {
      return {
        vencedor: vencedorSet1 === 1 ? confronto.dupla1Nome! : confronto.dupla2Nome!,
        placar: `${formatarSet(set1)}, ${formatarSet(set2)}`,
      };
    }

    const vencedorSet3 = venceuSet(set3);
    if (vencedorSet3 === undefined) return null;

    return {
      vencedor: vencedorSet3 === 1 ? confronto.dupla1Nome! : confronto.dupla2Nome!,
      placar: `${formatarSet(set1)}, ${formatarSet(set2)}, ${formatarSet(set3)}`,
    };
  };

  const validarPlacar = (): boolean => {
    if (setVazio(set1)) {
      setErro("O placar deve ser preenchido");
      return false;
    }

    const erroSet1 = validarSet(set1, true);
    if (erroSet1) {
      setErro(erroSet1);
      return false;
    }

    if (!melhorDe3) return true;

    const erroSet2 = validarSet(set2, true);
    if (erroSet2) {
      setErro(`Set 2: ${erroSet2}`);
      return false;
    }

    if (deveExibirTerceiroSet(set1, set2)) {
      const erroSet3 = validarSet(set3, true);
      if (erroSet3) {
        setErro(`Set 3 (desempate): ${erroSet3}`);
        return false;
      }
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

      const sets = melhorDe3
        ? deveExibirTerceiroSet(set1, set2)
          ? [set1, set2, set3]
          : [set1, set2]
        : [set1];

      await chaveService.registrarResultadoEliminatorio(
        confronto.id,
        montarPlacarFinal(sets)
      );
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
      <OverlayBackground onClick={!loading ? onClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          <Header>
            <Title>
              {isEdicao ? " Editar Resultado" : " Registrar Resultado"}
            </Title>
            <CloseButton onClick={onClose} disabled={loading}>✕</CloseButton>
          </Header>

          <Form onSubmit={handleSubmit}>
            <InfoBox>
              <InfoLabel>Confronto Eliminatório</InfoLabel>
              <InfoText>
                {confronto.dupla1Origem} vs {confronto.dupla2Origem}
              </InfoText>
            </InfoBox>

            <PlacarSection>
              <SectionLabel>{melhorDe3 ? "Placar (melhor de 3 sets)" : "Placar do Set"}</SectionLabel>

              {melhorDe3 && <SetLabelHeader>Set 1</SetLabelHeader>}
              <PlacarGrid>
                <InputGroup>
                  <InputLabel>{confronto.dupla1Nome}</InputLabel>
                  <ScoreInput
                    type="number"
                    min="0"
                    max="10"
                    value={set1.gamesDupla1 ?? ""}
                    onChange={(e) =>
                      setSet1((prev) => ({
                        ...prev,
                        gamesDupla1: e.target.value === "" ? undefined : parseInt(e.target.value),
                      }))
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
                    value={set1.gamesDupla2 ?? ""}
                    onChange={(e) =>
                      setSet1((prev) => ({
                        ...prev,
                        gamesDupla2: e.target.value === "" ? undefined : parseInt(e.target.value),
                      }))
                    }
                    placeholder="0"
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </PlacarGrid>

              {melhorDe3 && (
                <>
                  <SetLabelHeader>Set 2</SetLabelHeader>
                  <PlacarGrid>
                    <InputGroup>
                      <InputLabel>{confronto.dupla1Nome}</InputLabel>
                      <ScoreInput
                        type="number"
                        min="0"
                        max="10"
                        value={set2.gamesDupla1 ?? ""}
                        onChange={(e) =>
                          setSet2((prev) => ({
                            ...prev,
                            gamesDupla1: e.target.value === "" ? undefined : parseInt(e.target.value),
                          }))
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
                        value={set2.gamesDupla2 ?? ""}
                        onChange={(e) =>
                          setSet2((prev) => ({
                            ...prev,
                            gamesDupla2: e.target.value === "" ? undefined : parseInt(e.target.value),
                          }))
                        }
                        placeholder="0"
                        required
                        disabled={loading}
                      />
                    </InputGroup>
                  </PlacarGrid>
                </>
              )}

              {mostrarTerceiroSet && (
                <>
                  <SetLabelHeader>Set 3 (desempate)</SetLabelHeader>
                  <PlacarGrid>
                    <InputGroup>
                      <InputLabel>{confronto.dupla1Nome}</InputLabel>
                      <ScoreInput
                        type="number"
                        min="0"
                        max="10"
                        value={set3.gamesDupla1 ?? ""}
                        onChange={(e) =>
                          setSet3((prev) => ({
                            ...prev,
                            gamesDupla1: e.target.value === "" ? undefined : parseInt(e.target.value),
                          }))
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
                        value={set3.gamesDupla2 ?? ""}
                        onChange={(e) =>
                          setSet3((prev) => ({
                            ...prev,
                            gamesDupla2: e.target.value === "" ? undefined : parseInt(e.target.value),
                          }))
                        }
                        placeholder="0"
                        required
                        disabled={loading}
                      />
                    </InputGroup>
                  </PlacarGrid>
                </>
              )}
            </PlacarSection>

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
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalRegistrarResultadoEliminatorio;
