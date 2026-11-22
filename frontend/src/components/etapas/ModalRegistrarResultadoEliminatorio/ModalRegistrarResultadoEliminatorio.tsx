import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
} from "@/types/chave";
import { getChaveService } from "@/services";
import { Modal, Button } from "@/components/ui";
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
    <Modal
      isOpen
      onClose={onClose}
      title={isEdicao ? "Editar Resultado" : "Registrar Resultado"}
      size="lg"
      loading={loading}
    >
          {/* Botões ficam dentro do form (submit), não no rodapé do Modal */}
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
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !resultado} loading={loading}>
                {loading
                  ? isEdicao
                    ? "Atualizando..."
                    : "Salvando..."
                  : isEdicao
                    ? "Atualizar Resultado"
                    : "Salvar Resultado"}
              </Button>
            </ButtonsRow>
          </Form>
    </Modal>
  );
};

export default ModalRegistrarResultadoEliminatorio;
