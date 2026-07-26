/**
 * Responsabilidade: Modal para lançamento em lote de resultados do Super X
 * Permite preencher múltiplos resultados de uma vez e salvar apenas os preenchidos
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { PartidaReiDaPraia, ResultadoPartidaLoteSuperXDTO } from "@/types/reiDaPraia";
import { getSuperXService } from "@/services";
import {
  SetScore,
  deveExibirTerceiroSet,
  validarSet,
  montarPlacarFinal,
  setPreenchido,
} from "@/utils/placarMelhorDe3";

interface ModalLancamentoResultadosLoteSuperXProps {
  partidas: PartidaReiDaPraia[];
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ResultadoPartida {
  partidaId: string;
  set1: SetScore;
  set2: SetScore;
  set3: SetScore;
  erro?: string;
}

const setVazio = (set: SetScore): boolean =>
  (set.gamesDupla1 === undefined || set.gamesDupla1 === null) &&
  (set.gamesDupla2 === undefined || set.gamesDupla2 === null);

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
  max-width: 65rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  @media (min-width: 768px) {
    padding: 2rem;
  }
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

const ScrollableContent = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0;
`;

const RodadaSection = styled.div`
  margin-bottom: 1.5rem;
`;

const RodadaHeader = styled.div`
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem 0.5rem 0 0;
  font-weight: 600;
  color: #374151;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RodadaBadge = styled.span`
  background: #7c3aed;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
`;

const PartidasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  padding: 0.75rem;
  background: #fafafa;
`;

const PartidaCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const PartidaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PartidaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case "agendada":
        return `background: #fef3c7; color: #92400e;`;
      case "finalizada":
        return `background: #dcfce7; color: #166534;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const DuplasContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const DuplaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DuplaNome = styled.span`
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`;

const ScoreInput = styled.input`
  width: 4rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.375rem 0.5rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    ring: 2px;
    ring-color: #7c3aed;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #d1d5db;
  }
`;

const VsSeparator = styled.div`
  text-align: center;
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ScoreInputsGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SetsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SetsHeaderSpacer = styled.div`
  flex: 1;
`;

const SetLabel = styled.span`
  width: 4rem;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
`;

const ErrorText = styled.p`
  font-size: 0.75rem;
  color: #991b1b;
  margin: 0.25rem 0 0 0;
`;

const Footer = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
  background: #f9fafb;
  flex-shrink: 0;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const SummaryBox = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const SummaryLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const SummaryValue = styled.span<{ $variant?: "success" | "warning" }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => {
    switch (props.$variant) {
      case "success":
        return "#16a34a";
      case "warning":
        return "#ea580c";
      default:
        return "#111827";
    }
  }};
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.625rem 1rem;
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

// ============== HELPERS ==============

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    agendada: "Aguardando",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
    wo: "W.O.",
  };
  return labels[status] || status;
};

const agruparPorRodada = (
  partidas: PartidaReiDaPraia[]
): Map<number, PartidaReiDaPraia[]> => {
  const mapa = new Map<number, PartidaReiDaPraia[]>();

  partidas.forEach((partida) => {
    const rodada = partida.rodada || 1;
    if (!mapa.has(rodada)) {
      mapa.set(rodada, []);
    }
    mapa.get(rodada)!.push(partida);
  });

  return mapa;
};

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteSuperX: React.FC<
  ModalLancamentoResultadosLoteSuperXProps
> = ({ partidas, etapaFinalizada = false, melhorDe3 = false, onClose, onSuccess }) => {
  const superXService = getSuperXService();
  const [resultados, setResultados] = useState<Map<string, ResultadoPartida>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  // Inicializar resultados com valores existentes
  useEffect(() => {
    const mapaInicial = new Map<string, ResultadoPartida>();

    partidas.forEach((partida) => {
      const sets = partida.status === "finalizada" ? partida.placar || [] : [];
      mapaInicial.set(partida.id, {
        partidaId: partida.id,
        set1: sets[0] ? { gamesDupla1: sets[0].gamesDupla1, gamesDupla2: sets[0].gamesDupla2 } : {},
        set2: sets[1] ? { gamesDupla1: sets[1].gamesDupla1, gamesDupla2: sets[1].gamesDupla2 } : {},
        set3: sets[2] ? { gamesDupla1: sets[2].gamesDupla1, gamesDupla2: sets[2].gamesDupla2 } : {},
      });
    });

    setResultados(mapaInicial);
  }, [partidas]);

  const handleScoreChange = (
    partidaId: string,
    setKey: "set1" | "set2" | "set3",
    campo: "gamesDupla1" | "gamesDupla2",
    valor: string
  ) => {
    const valorNumerico = valor === "" ? undefined : parseInt(valor);

    setResultados((prev) => {
      const novo = new Map(prev);
      const resultado = novo.get(partidaId) || {
        partidaId,
        set1: {},
        set2: {},
        set3: {},
      };

      novo.set(partidaId, {
        ...resultado,
        [setKey]: { ...resultado[setKey], [campo]: valorNumerico },
        erro: undefined, // Limpar erro ao editar
      });

      return novo;
    });
  };

  // Retorna mensagem de erro ou undefined se o resultado for válido (ou estiver vazio, para ser pulado)
  const validarResultado = (resultado: ResultadoPartida): string | undefined => {
    const partidaVazia =
      setVazio(resultado.set1) && (!melhorDe3 || setVazio(resultado.set2));
    if (partidaVazia) return undefined;

    const erroSet1 = validarSet(resultado.set1, true);
    if (erroSet1) return erroSet1;

    if (!melhorDe3) return undefined;

    const erroSet2 = validarSet(resultado.set2, true);
    if (erroSet2) return `Set 2: ${erroSet2}`;

    if (deveExibirTerceiroSet(resultado.set1, resultado.set2)) {
      const erroSet3 = validarSet(resultado.set3, true);
      if (erroSet3) return `Set 3 (desempate): ${erroSet3}`;
    }

    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filtrar apenas resultados que foram preenchidos
    const resultadosPreenchidos: ResultadoPartida[] = [];

    for (const resultado of Array.from(resultados.values())) {
      const partidaVazia =
        setVazio(resultado.set1) && (!melhorDe3 || setVazio(resultado.set2));
      if (partidaVazia) continue;

      const erro = validarResultado(resultado);
      if (erro) {
        setResultados((prev) => {
          const novo = new Map(prev);
          novo.set(resultado.partidaId, { ...resultado, erro });
          return novo;
        });
        return; // Para no primeiro erro
      }

      resultadosPreenchidos.push(resultado);
    }

    if (resultadosPreenchidos.length === 0) {
      alert("Nenhum resultado foi preenchido");
      return;
    }

    try {
      setLoading(true);

      // Pegar etapaId da primeira partida
      const primeiraPartida = partidas[0];
      if (!primeiraPartida) {
        alert("Nenhuma partida encontrada");
        return;
      }

      // Montar array de resultados em lote
      const resultadosLote: ResultadoPartidaLoteSuperXDTO[] = resultadosPreenchidos.map(
        (resultado) => {
          const sets = melhorDe3
            ? deveExibirTerceiroSet(resultado.set1, resultado.set2)
              ? [resultado.set1, resultado.set2, resultado.set3]
              : [resultado.set1, resultado.set2]
            : [resultado.set1];

          return {
            partidaId: resultado.partidaId,
            placar: montarPlacarFinal(sets),
          };
        }
      );

      // Enviar todos os resultados em uma única requisição
      const response = await superXService.registrarResultadosEmLote(
        primeiraPartida.etapaId,
        resultadosLote
      );

      if (response.erros && response.erros.length > 0) {
        if (response.processados > 0) {
          alert(
            `${response.processados} resultado(s) salvo(s) com sucesso, ${response.erros.length} erro(s).`
          );
        } else {
          alert("Nenhum resultado foi salvo. Verifique os erros.");
        }
      } else {
        alert(
          `${response.processados} resultado(s) ${
            response.processados === 1 ? "salvo" : "salvos"
          } com sucesso!`
        );
        onSuccess();
      }
    } catch (err: any) {
      alert(err.message || "Erro ao salvar resultados");
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const totalPartidas = partidas.length;
  const partidasFinalizadas = partidas.filter((p) => p.status === "finalizada")
    .length;
  const resultadosASeremSalvos = Array.from(resultados.values()).filter(
    (r) => setPreenchido(r.set1) && (!melhorDe3 || setPreenchido(r.set2))
  ).length;

  const partidasPorRodada = agruparPorRodada(partidas);
  const rodadasOrdenadas = Array.from(partidasPorRodada.keys()).sort(
    (a, b) => a - b
  );

  return (
    <Overlay>
      <OverlayBackground onClick={!loading ? onClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          {/* Header */}
          <Header>
            <Title>Lançamento de Resultados - Super X</Title>
            <CloseButton onClick={onClose} disabled={loading}>
              ×
            </CloseButton>
          </Header>

          {/* Scrollable Content */}
          <ScrollableContent>
            <InfoBox>
              <InfoText>
                Preencha os resultados das partidas abaixo. Apenas os resultados
                preenchidos serão salvos. Partidas sem placar permanecerão como
                "Aguardando".
              </InfoText>
            </InfoBox>

            <form onSubmit={handleSubmit} id="form-resultados-lote">
              {rodadasOrdenadas.map((rodada) => {
                const partidasDaRodada = partidasPorRodada.get(rodada) || [];

                return (
                  <RodadaSection key={rodada}>
                    <RodadaHeader>
                      <span>Rodada {rodada}</span>
                      <RodadaBadge>
                        {partidasDaRodada.length}{" "}
                        {partidasDaRodada.length === 1 ? "partida" : "partidas"}
                      </RodadaBadge>
                    </RodadaHeader>

                    <PartidasList>
                      {partidasDaRodada.map((partida) => {
                        const resultado = resultados.get(partida.id);

                        return (
                          <PartidaCard key={partida.id}>
                            <PartidaHeader>
                              <PartidaInfo>
                                <StatusBadge $status={partida.status}>
                                  {getStatusLabel(partida.status)}
                                </StatusBadge>
                              </PartidaInfo>
                            </PartidaHeader>

                            {(() => {
                              const mostrarTerceiroSet =
                                melhorDe3 &&
                                deveExibirTerceiroSet(
                                  resultado?.set1 || {},
                                  resultado?.set2 || {}
                                );

                              return (
                                <DuplasContainer>
                                  {melhorDe3 && (
                                    <SetsHeader>
                                      <SetsHeaderSpacer />
                                      <SetLabel>Set 1</SetLabel>
                                      <SetLabel>Set 2</SetLabel>
                                      {mostrarTerceiroSet && (
                                        <SetLabel>Desempate</SetLabel>
                                      )}
                                    </SetsHeader>
                                  )}

                                  <DuplaRow>
                                    <DuplaNome>
                                      {partida.jogador1ANome} &{" "}
                                      {partida.jogador1BNome}
                                    </DuplaNome>
                                    <ScoreInputsGroup>
                                      <ScoreInput
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={resultado?.set1?.gamesDupla1 ?? ""}
                                        onChange={(e) =>
                                          handleScoreChange(partida.id, "set1", "gamesDupla1", e.target.value)
                                        }
                                        placeholder="-"
                                        disabled={loading}
                                      />
                                      {melhorDe3 && (
                                        <ScoreInput
                                          type="number"
                                          min="0"
                                          max="10"
                                          value={resultado?.set2?.gamesDupla1 ?? ""}
                                          onChange={(e) =>
                                            handleScoreChange(partida.id, "set2", "gamesDupla1", e.target.value)
                                          }
                                          placeholder="-"
                                          disabled={loading}
                                        />
                                      )}
                                      {mostrarTerceiroSet && (
                                        <ScoreInput
                                          type="number"
                                          min="0"
                                          max="10"
                                          value={resultado?.set3?.gamesDupla1 ?? ""}
                                          onChange={(e) =>
                                            handleScoreChange(partida.id, "set3", "gamesDupla1", e.target.value)
                                          }
                                          placeholder="-"
                                          disabled={loading}
                                        />
                                      )}
                                    </ScoreInputsGroup>
                                  </DuplaRow>

                                  <VsSeparator>VS</VsSeparator>

                                  <DuplaRow>
                                    <DuplaNome>
                                      {partida.jogador2ANome} &{" "}
                                      {partida.jogador2BNome}
                                    </DuplaNome>
                                    <ScoreInputsGroup>
                                      <ScoreInput
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={resultado?.set1?.gamesDupla2 ?? ""}
                                        onChange={(e) =>
                                          handleScoreChange(partida.id, "set1", "gamesDupla2", e.target.value)
                                        }
                                        placeholder="-"
                                        disabled={loading}
                                      />
                                      {melhorDe3 && (
                                        <ScoreInput
                                          type="number"
                                          min="0"
                                          max="10"
                                          value={resultado?.set2?.gamesDupla2 ?? ""}
                                          onChange={(e) =>
                                            handleScoreChange(partida.id, "set2", "gamesDupla2", e.target.value)
                                          }
                                          placeholder="-"
                                          disabled={loading}
                                        />
                                      )}
                                      {mostrarTerceiroSet && (
                                        <ScoreInput
                                          type="number"
                                          min="0"
                                          max="10"
                                          value={resultado?.set3?.gamesDupla2 ?? ""}
                                          onChange={(e) =>
                                            handleScoreChange(partida.id, "set3", "gamesDupla2", e.target.value)
                                          }
                                          placeholder="-"
                                          disabled={loading}
                                        />
                                      )}
                                    </ScoreInputsGroup>
                                  </DuplaRow>
                                </DuplasContainer>
                              );
                            })()}

                            {resultado?.erro && (
                              <ErrorText>{resultado.erro}</ErrorText>
                            )}
                          </PartidaCard>
                        );
                      })}
                    </PartidasList>
                  </RodadaSection>
                );
              })}
            </form>
          </ScrollableContent>

          {/* Footer */}
          <Footer>
            <SummaryBox>
              <SummaryItem>
                <SummaryLabel>Total de Partidas</SummaryLabel>
                <SummaryValue>{totalPartidas}</SummaryValue>
              </SummaryItem>

              <SummaryItem>
                <SummaryLabel>Já Finalizadas</SummaryLabel>
                <SummaryValue $variant="success">
                  {partidasFinalizadas}
                </SummaryValue>
              </SummaryItem>

              <SummaryItem>
                <SummaryLabel>Serão Salvas</SummaryLabel>
                <SummaryValue $variant="warning">
                  {resultadosASeremSalvos}
                </SummaryValue>
              </SummaryItem>
            </SummaryBox>

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
                form="form-resultados-lote"
                $variant="primary"
                disabled={loading || resultadosASeremSalvos === 0 || etapaFinalizada}
              >
                {etapaFinalizada ? (
                  "Etapa Finalizada"
                ) : loading ? (
                  <>
                    <Spinner />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    Salvar {resultadosASeremSalvos}{" "}
                    {resultadosASeremSalvos === 1 ? "Resultado" : "Resultados"}
                  </>
                )}
              </Button>
            </ButtonsRow>
          </Footer>
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ModalLancamentoResultadosLoteSuperX;
