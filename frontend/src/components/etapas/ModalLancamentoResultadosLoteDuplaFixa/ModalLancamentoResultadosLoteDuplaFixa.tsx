import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Partida, SetPartida, ResultadoPartidaLoteDTO } from "@/types/chave";
import { getPartidaService } from "@/services";

interface ModalLancamentoResultadosLoteDuplaFixaProps {
  partidas: Partida[];
  grupoNome: string;
  etapaFinalizada?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ResultadoPartida {
  partidaId: string;
  gamesDupla1: number | undefined;
  gamesDupla2: number | undefined;
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
  max-width: 56rem;
  width: 100%;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;

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

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PartidasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PartidaCard = styled.div<{ $hasError?: boolean }>`
  border: 1px solid ${(props) => (props.$hasError ? "#fca5a5" : "#e5e7eb")};
  border-radius: 0.5rem;
  padding: 1rem;
  background: ${(props) => (props.$hasError ? "#fef2f2" : "white")};

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const PartidaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PartidaLabel = styled.div`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
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

const DuplasBox = styled.div`
  margin-bottom: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const DuplasContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const DuplaNome = styled.span`
  font-weight: 600;
  color: #111827;
  font-size: 0.8125rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const VsSeparator = styled.span`
  color: #9ca3af;
  font-weight: 700;
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  min-height: 2rem;
  display: flex;
  align-items: flex-end;

  @media (min-width: 768px) {
    font-size: 0.8125rem;
  }
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

const ErrorText = styled.p`
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
`;

const GlobalErrorBox = styled.div`
  margin-top: 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const GlobalErrorText = styled.p`
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

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 1rem;
  font-weight: 600;
`;

// ============== HELPERS ==============

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    agendada: "Aguardando",
    finalizada: "Finalizada",
  };
  return labels[status] || status;
};

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteDuplaFixa: React.FC<
  ModalLancamentoResultadosLoteDuplaFixaProps
> = ({ partidas, grupoNome, etapaFinalizada = false, onClose, onSuccess }) => {
  const partidaService = getPartidaService();
  const [resultados, setResultados] = useState<Map<string, ResultadoPartida>>(
    new Map()
  );
  const [erros, setErros] = useState<Map<string, string>>(new Map());
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inicializar resultados com dados existentes
  useEffect(() => {
    const mapaInicial = new Map<string, ResultadoPartida>();

    partidas.forEach((partida) => {
      if (
        partida.status === "finalizada" &&
        partida.placar &&
        partida.placar.length > 0
      ) {
        mapaInicial.set(partida.id, {
          partidaId: partida.id,
          gamesDupla1: partida.placar[0].gamesDupla1,
          gamesDupla2: partida.placar[0].gamesDupla2,
        });
      } else {
        mapaInicial.set(partida.id, {
          partidaId: partida.id,
          gamesDupla1: undefined,
          gamesDupla2: undefined,
        });
      }
    });

    setResultados(mapaInicial);
  }, [partidas]);

  const handleInputChange = (
    partidaId: string,
    campo: "gamesDupla1" | "gamesDupla2",
    valor: string
  ) => {
    const resultadoAtual = resultados.get(partidaId) || {
      partidaId,
      gamesDupla1: undefined,
      gamesDupla2: undefined,
    };
    const novoResultado: ResultadoPartida = {
      ...resultadoAtual,
      [campo]: valor === "" ? undefined : parseInt(valor),
    };

    setResultados((prev) => new Map(prev).set(partidaId, novoResultado));

    // Limpar erro desta partida
    setErros((prev) => {
      const novosErros = new Map(prev);
      novosErros.delete(partidaId);
      return novosErros;
    });
    setErroGlobal(null);
  };

  const validarPlacar = (resultado: ResultadoPartida): string | null => {
    const { gamesDupla1, gamesDupla2 } = resultado;

    // Se ambos vazios, não validar (será ignorado no submit)
    if (
      (gamesDupla1 === undefined || gamesDupla1 === null) &&
      (gamesDupla2 === undefined || gamesDupla2 === null)
    ) {
      return null;
    }

    if (gamesDupla1 === undefined || gamesDupla1 === null) {
      return "Preencha o placar da primeira dupla";
    }

    if (gamesDupla2 === undefined || gamesDupla2 === null) {
      return "Preencha o placar da segunda dupla";
    }

    if (gamesDupla1 === 0 && gamesDupla2 === 0) {
      return "O placar não pode ser 0 x 0";
    }

    const maxGames = Math.max(gamesDupla1, gamesDupla2);
    const minGames = Math.min(gamesDupla1, gamesDupla2);

    if (maxGames < 4) {
      return "O set deve ter no mínimo 4 games para o vencedor";
    }

    if (maxGames === 4 && minGames > 2) {
      return "Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2";
    }

    if (maxGames === 5 && minGames < 3) {
      return "Set com 5 games: placar deve ser 5-3 ou 5-4";
    }

    if (maxGames === 6 && minGames > 4) {
      return "Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4";
    }

    if (maxGames === 7 && minGames < 5) {
      return "Set com 7 games: placar deve ser 7-5 ou 7-6";
    }

    if (maxGames > 7) {
      return "Set não pode ter mais de 7 games";
    }

    if (gamesDupla1 === gamesDupla2) {
      return "Não há um vencedor definido";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros(new Map());
    setErroGlobal(null);

    // Filtrar apenas resultados preenchidos
    const resultadosPreenchidos: ResultadoPartida[] = [];
    const novosErros = new Map<string, string>();

    for (const resultado of Array.from(resultados.values())) {
      const { gamesDupla1, gamesDupla2 } = resultado;

      // Se ambos vazios, pular
      if (
        (gamesDupla1 === undefined || gamesDupla1 === null) &&
        (gamesDupla2 === undefined || gamesDupla2 === null)
      ) {
        continue;
      }

      // Validar
      const erro = validarPlacar(resultado);
      if (erro) {
        novosErros.set(resultado.partidaId, erro);
      } else {
        resultadosPreenchidos.push(resultado);
      }
    }

    if (novosErros.size > 0) {
      setErros(novosErros);
      setErroGlobal(
        `${novosErros.size} partida(s) com erro de validação. Corrija os placares destacados.`
      );
      return;
    }

    if (resultadosPreenchidos.length === 0) {
      setErroGlobal("Nenhum resultado foi preenchido");
      return;
    }

    try {
      setLoading(true);

      // Montar array de resultados em lote
      const resultadosLote: ResultadoPartidaLoteDTO[] = resultadosPreenchidos.map(
        (resultado) => {
          const set: SetPartida = {
            numero: 1,
            gamesDupla1: resultado.gamesDupla1!,
            gamesDupla2: resultado.gamesDupla2!,
            vencedorId: "",
          };

          return {
            partidaId: resultado.partidaId,
            placar: [set],
          };
        }
      );

      // Enviar todos os resultados em uma única requisição
      const response = await partidaService.registrarResultadosEmLote(resultadosLote);

      if (response.erros.length > 0) {
        // Mostrar erros específicos
        const novosErros = new Map<string, string>();
        response.erros.forEach((item: { partidaId: string; erro: string }) => {
          novosErros.set(item.partidaId, item.erro);
        });
        setErros(novosErros);

        if (response.processados > 0) {
          alert(
            `${response.processados} resultado(s) salvo(s) com sucesso, ${response.erros.length} erro(s).`
          );
        } else {
          setErroGlobal("Nenhum resultado foi salvo. Verifique os erros.");
        }
      } else {
        alert(`${response.processados} resultado(s) salvo(s) com sucesso!`);
        onSuccess();
      }
    } catch (err: any) {
      setErroGlobal(
        err.message || "Erro ao salvar resultados. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const totalPartidas = partidas.length;
  const jaFinalizadas = partidas.filter((p) => p.status === "finalizada").length;
  const seraoSalvas = Array.from(resultados.values()).filter((r) => {
    const { gamesDupla1, gamesDupla2 } = r;
    return (
      (gamesDupla1 !== undefined && gamesDupla1 !== null) ||
      (gamesDupla2 !== undefined && gamesDupla2 !== null)
    );
  }).length;

  return (
    <Overlay>
      <OverlayBackground onClick={!loading ? onClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          <Header>
            <Title>Registrar Resultados - {grupoNome}</Title>
            <CloseButton onClick={onClose} disabled={loading}>
              ✕
            </CloseButton>
          </Header>

          <SummaryBox>
            <SummaryItem>
              <SummaryLabel>Total de Partidas</SummaryLabel>
              <SummaryValue>{totalPartidas}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Já Finalizadas</SummaryLabel>
              <SummaryValue>{jaFinalizadas}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Serão Salvas</SummaryLabel>
              <SummaryValue>{seraoSalvas}</SummaryValue>
            </SummaryItem>
          </SummaryBox>

          <Form onSubmit={handleSubmit}>
            <PartidasList>
              {partidas.map((partida, index) => {
                const resultado = resultados.get(partida.id);
                const erro = erros.get(partida.id);

                return (
                  <PartidaCard key={partida.id} $hasError={!!erro}>
                    <PartidaHeader>
                      <PartidaLabel>PARTIDA {index + 1}</PartidaLabel>
                      <StatusBadge $status={partida.status}>
                        {getStatusLabel(partida.status)}
                      </StatusBadge>
                    </PartidaHeader>

                    <DuplasBox>
                      <DuplasContent>
                        <DuplaNome>{partida.dupla1Nome}</DuplaNome>
                        <VsSeparator>VS</VsSeparator>
                        <DuplaNome>{partida.dupla2Nome}</DuplaNome>
                      </DuplasContent>
                    </DuplasBox>

                    <PlacarGrid>
                      <InputGroup>
                        <InputLabel>{partida.dupla1Nome}</InputLabel>
                        <ScoreInput
                          type="number"
                          min="0"
                          max="10"
                          value={resultado?.gamesDupla1 ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              partida.id,
                              "gamesDupla1",
                              e.target.value
                            )
                          }
                          placeholder="0"
                          disabled={loading}
                        />
                      </InputGroup>

                      <InputGroup>
                        <InputLabel>{partida.dupla2Nome}</InputLabel>
                        <ScoreInput
                          type="number"
                          min="0"
                          max="10"
                          value={resultado?.gamesDupla2 ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              partida.id,
                              "gamesDupla2",
                              e.target.value
                            )
                          }
                          placeholder="0"
                          disabled={loading}
                        />
                      </InputGroup>
                    </PlacarGrid>

                    {erro && <ErrorText>❌ {erro}</ErrorText>}
                  </PartidaCard>
                );
              })}
            </PartidasList>

            {erroGlobal && (
              <GlobalErrorBox>
                <GlobalErrorText>{erroGlobal}</GlobalErrorText>
              </GlobalErrorBox>
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
              <Button type="submit" $variant="primary" disabled={loading || etapaFinalizada}>
                {etapaFinalizada ? "Etapa Finalizada" : loading ? "Salvando..." : `Salvar Resultados (${seraoSalvas})`}
              </Button>
            </ButtonsRow>
          </Form>
        </ModalContainer>
      </ModalWrapper>

      {loading && (
        <LoadingOverlay>
          <Spinner />
          <LoadingText>Salvando resultados...</LoadingText>
        </LoadingOverlay>
      )}
    </Overlay>
  );
};

export default ModalLancamentoResultadosLoteDuplaFixa;
