import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import {
  PartidaTeams,
  ConfrontoEquipe,
  Equipe,
  StatusPartidaTeams,
  ResultadoPartidaLoteDTO,
} from "@/types/teams";
import { ModalDefinirJogadoresPartida } from "../ModalDefinirJogadoresPartida";
import {
  SetScore,
  deveExibirTerceiroSet,
  validarSet,
  montarPlacarFinal,
} from "@/utils/placarMelhorDe3";

interface ModalLancamentoResultadosLoteTeamsProps {
  etapaId: string;
  confronto: ConfrontoEquipe;
  partidas: PartidaTeams[];
  equipes: Equipe[];
  tipoFormacaoManual?: boolean;
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

const ConfrontoBox = styled.div`
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: white;
`;

const ConfrontoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const EquipeNome = styled.span`
  font-weight: 700;
  font-size: 1rem;
`;

const PlacarConfronto = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
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
  color: #059669;
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

const PartidaCard = styled.div<{ $hasError?: boolean; $needsPlayers?: boolean }>`
  border: 1px solid ${(props) => (props.$hasError ? "#fca5a5" : props.$needsPlayers ? "#fde68a" : "#e5e7eb")};
  border-radius: 0.5rem;
  padding: 1rem;
  background: ${(props) => (props.$hasError ? "#fef2f2" : props.$needsPlayers ? "#fefce8" : "white")};

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
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const TipoBadge = styled.span<{ $tipo: string }>`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$tipo) {
      case "feminino":
        return `background: #fce7f3; color: #9d174d;`;
      case "masculino":
        return `background: #dbeafe; color: #1e40af;`;
      case "decider":
        return `background: #fef3c7; color: #92400e;`;
      default:
        return `background: #e5e7eb; color: #374151;`;
    }
  }}
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
  background: #dcfce7;
  border: 1px solid #bbf7d0;
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
  text-align: center;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const VsSeparator = styled.span`
  color: #9ca3af;
  font-weight: 700;
  font-size: 0.75rem;
`;

const NeedsPlayersAlert = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const DefinePlayersButton = styled.button`
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #d97706;
  }
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
    ring-color: #059669;
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

const getTipoJogoLabel = (tipo?: string): string => {
  if (!tipo) return "";
  switch (tipo) {
    case "feminino":
      return "FEM";
    case "masculino":
      return "MASC";
    case "misto":
      return "MISTO";
    case "decider":
      return "DECIDER";
    default:
      return tipo.toUpperCase();
  }
};

const getDuplaLabel = (partida: PartidaTeams, lado: 1 | 2): string => {
  const dupla = lado === 1 ? partida.dupla1 : partida.dupla2;
  const equipeNome = lado === 1 ? partida.equipe1Nome : partida.equipe2Nome;

  if (!dupla || dupla.length === 0) {
    return equipeNome || "A definir";
  }

  return dupla.map((j) => j.nome).join(" / ");
};

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteTeams: React.FC<
  ModalLancamentoResultadosLoteTeamsProps
> = ({ etapaId, confronto, partidas, equipes, tipoFormacaoManual = false, etapaFinalizada = false, melhorDe3 = false, onClose, onSuccess }) => {
  const teamsService = getTeamsService();
  const [resultados, setResultados] = useState<Map<string, ResultadoPartida>>(new Map());
  const [erros, setErros] = useState<Map<string, string>>(new Map());
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [partidaParaDefinirJogadores, setPartidaParaDefinirJogadores] = useState<PartidaTeams | null>(null);
  const [partidasAtuais, setPartidasAtuais] = useState<PartidaTeams[]>(partidas);

  // Inicializar resultados com dados existentes
  useEffect(() => {
    const mapaInicial = new Map<string, ResultadoPartida>();

    partidasAtuais.forEach((partida) => {
      const sets =
        partida.status === StatusPartidaTeams.FINALIZADA ? partida.placar || [] : [];
      mapaInicial.set(partida.id, {
        partidaId: partida.id,
        set1: sets[0] ? { gamesDupla1: sets[0].gamesDupla1, gamesDupla2: sets[0].gamesDupla2 } : {},
        set2: sets[1] ? { gamesDupla1: sets[1].gamesDupla1, gamesDupla2: sets[1].gamesDupla2 } : {},
        set3: sets[2] ? { gamesDupla1: sets[2].gamesDupla1, gamesDupla2: sets[2].gamesDupla2 } : {},
      });
    });

    setResultados(mapaInicial);
  }, [partidasAtuais]);

  const handleInputChange = (
    partidaId: string,
    setKey: "set1" | "set2" | "set3",
    campo: "gamesDupla1" | "gamesDupla2",
    valor: string
  ) => {
    const resultadoAtual = resultados.get(partidaId) || {
      partidaId,
      set1: {},
      set2: {},
      set3: {},
    };
    const novoResultado: ResultadoPartida = {
      ...resultadoAtual,
      [setKey]: { ...resultadoAtual[setKey], [campo]: valor === "" ? undefined : parseInt(valor) },
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
    const partidaVazia =
      setVazio(resultado.set1) && (!melhorDe3 || setVazio(resultado.set2));
    if (partidaVazia) return null;

    const erroSet1 = validarSet(resultado.set1, true);
    if (erroSet1) return erroSet1;

    if (!melhorDe3) return null;

    const erroSet2 = validarSet(resultado.set2, true);
    if (erroSet2) return `Set 2: ${erroSet2}`;

    if (deveExibirTerceiroSet(resultado.set1, resultado.set2)) {
      const erroSet3 = validarSet(resultado.set3, true);
      if (erroSet3) return `Set 3 (desempate): ${erroSet3}`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros(new Map());
    setErroGlobal(null);

    // Filtrar apenas resultados preenchidos e partidas com jogadores definidos
    const resultadosPreenchidos: ResultadoPartida[] = [];
    const novosErros = new Map<string, string>();

    for (const resultado of Array.from(resultados.values())) {
      const partidaVazia =
        setVazio(resultado.set1) && (!melhorDe3 || setVazio(resultado.set2));
      if (partidaVazia) continue;

      // Verificar se a partida tem jogadores definidos
      const partida = partidasAtuais.find((p) => p.id === resultado.partidaId);
      if (partida && tipoFormacaoManual && (!partida.dupla1 || partida.dupla1.length === 0)) {
        novosErros.set(resultado.partidaId, "Defina os jogadores antes de registrar o resultado");
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
        `${novosErros.size} partida(s) com erro de validação. Corrija os problemas destacados.`
      );
      return;
    }

    if (resultadosPreenchidos.length === 0) {
      setErroGlobal("Nenhum resultado foi preenchido");
      return;
    }

    try {
      setLoading(true);

      // Montar DTOs para o endpoint em lote
      const resultadosLote: ResultadoPartidaLoteDTO[] = resultadosPreenchidos.map(
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

      // Chamar endpoint em lote
      const response = await teamsService.registrarResultadosEmLote(
        etapaId,
        resultadosLote
      );

      // Verificar se houve erros parciais
      if (response.erros && response.erros.length > 0) {
        const errosMap = new Map<string, string>();
        response.erros.forEach((item: { partidaId: string; erro: string }) => {
          errosMap.set(item.partidaId, item.erro);
        });
        setErros(errosMap);
        setErroGlobal(
          `${response.processados} resultado(s) salvo(s), mas ${response.erros.length} erro(s) ocorreram.`
        );
        return;
      }

      alert(`${response.processados} resultado(s) salvo(s) com sucesso!`);
      onSuccess();
    } catch (err: any) {
      setErroGlobal(
        err.message || "Erro ao salvar resultados. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDefinirJogadores = (partida: PartidaTeams) => {
    setPartidaParaDefinirJogadores(partida);
  };

  const handleJogadoresDefinidos = async () => {
    // Recarregar partidas do confronto
    try {
      const novasPartidas = await teamsService.buscarPartidasConfronto(etapaId, confronto.id);
      setPartidasAtuais(novasPartidas);
    } catch (error) {
      console.error("Erro ao recarregar partidas:", error);
    }
    setPartidaParaDefinirJogadores(null);
  };

  // Calcular estatísticas
  const totalPartidas = partidasAtuais.length;
  const jaFinalizadas = partidasAtuais.filter((p) => p.status === StatusPartidaTeams.FINALIZADA).length;
  const seraoSalvas = Array.from(resultados.values()).filter(
    (r) => !setVazio(r.set1) || (melhorDe3 && !setVazio(r.set2))
  ).length;
  const precisamJogadores = partidasAtuais.filter(
    (p) => tipoFormacaoManual && (!p.dupla1 || p.dupla1.length === 0)
  ).length;

  // Encontrar as equipes
  const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
  const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);

  return (
    <Overlay>
      <OverlayBackground onClick={!loading ? onClose : undefined} />

      <ModalWrapper>
        <ModalContainer>
          <Header>
            <Title>Registrar Resultados - Confronto</Title>
            <CloseButton onClick={onClose} disabled={loading}>
              ✕
            </CloseButton>
          </Header>

          <ConfrontoBox>
            <ConfrontoRow>
              <EquipeNome>{confronto.equipe1Nome}</EquipeNome>
              <PlacarConfronto>
                <span>{confronto.jogosEquipe1}</span>
                <span>x</span>
                <span>{confronto.jogosEquipe2}</span>
              </PlacarConfronto>
              <EquipeNome>{confronto.equipe2Nome}</EquipeNome>
            </ConfrontoRow>
          </ConfrontoBox>

          <SummaryBox>
            <SummaryItem>
              <SummaryLabel>Total Partidas</SummaryLabel>
              <SummaryValue>{totalPartidas}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Finalizadas</SummaryLabel>
              <SummaryValue>{jaFinalizadas}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Serão Salvas</SummaryLabel>
              <SummaryValue>{seraoSalvas}</SummaryValue>
            </SummaryItem>
            {tipoFormacaoManual && precisamJogadores > 0 && (
              <SummaryItem>
                <SummaryLabel>Sem Jogadores</SummaryLabel>
                <SummaryValue style={{ color: "#f59e0b" }}>{precisamJogadores}</SummaryValue>
              </SummaryItem>
            )}
          </SummaryBox>

          <Form onSubmit={handleSubmit}>
            <PartidasList>
              {partidasAtuais.map((partida, index) => {
                const resultado = resultados.get(partida.id);
                const erro = erros.get(partida.id);
                const precisaDefinirJogadores =
                  tipoFormacaoManual && (!partida.dupla1 || partida.dupla1.length === 0);

                return (
                  <PartidaCard
                    key={partida.id}
                    $hasError={!!erro}
                    $needsPlayers={precisaDefinirJogadores}
                  >
                    <PartidaHeader>
                      <PartidaLabel>
                        JOGO {index + 1}
                        {partida.tipoJogo && (
                          <TipoBadge $tipo={partida.tipoJogo}>
                            {getTipoJogoLabel(partida.tipoJogo)}
                          </TipoBadge>
                        )}
                      </PartidaLabel>
                      <StatusBadge $status={partida.status}>
                        {getStatusLabel(partida.status)}
                      </StatusBadge>
                    </PartidaHeader>

                    {precisaDefinirJogadores ? (
                      <NeedsPlayersAlert>
                        <span>Jogadores não definidos</span>
                        <DefinePlayersButton type="button" onClick={() => handleDefinirJogadores(partida)}>
                          Definir Jogadores
                        </DefinePlayersButton>
                      </NeedsPlayersAlert>
                    ) : (
                      <DuplasBox>
                        <DuplasContent>
                          <DuplaNome>{getDuplaLabel(partida, 1)}</DuplaNome>
                          <VsSeparator>VS</VsSeparator>
                          <DuplaNome>{getDuplaLabel(partida, 2)}</DuplaNome>
                        </DuplasContent>
                      </DuplasBox>
                    )}

                    {(() => {
                      const mostrarTerceiroSet =
                        melhorDe3 &&
                        deveExibirTerceiroSet(
                          resultado?.set1 || {},
                          resultado?.set2 || {}
                        );

                      return (
                        <>
                          {melhorDe3 && <SetLabelHeader>Set 1</SetLabelHeader>}
                          <PlacarGrid>
                            <InputGroup>
                              <InputLabel>{partida.equipe1Nome}</InputLabel>
                              <ScoreInput
                                type="number"
                                min="0"
                                max="10"
                                value={resultado?.set1?.gamesDupla1 ?? ""}
                                onChange={(e) =>
                                  handleInputChange(partida.id, "set1", "gamesDupla1", e.target.value)
                                }
                                placeholder="0"
                                disabled={loading || precisaDefinirJogadores}
                              />
                            </InputGroup>

                            <InputGroup>
                              <InputLabel>{partida.equipe2Nome}</InputLabel>
                              <ScoreInput
                                type="number"
                                min="0"
                                max="10"
                                value={resultado?.set1?.gamesDupla2 ?? ""}
                                onChange={(e) =>
                                  handleInputChange(partida.id, "set1", "gamesDupla2", e.target.value)
                                }
                                placeholder="0"
                                disabled={loading || precisaDefinirJogadores}
                              />
                            </InputGroup>
                          </PlacarGrid>

                          {melhorDe3 && (
                            <>
                              <SetLabelHeader>Set 2</SetLabelHeader>
                              <PlacarGrid>
                                <InputGroup>
                                  <InputLabel>{partida.equipe1Nome}</InputLabel>
                                  <ScoreInput
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={resultado?.set2?.gamesDupla1 ?? ""}
                                    onChange={(e) =>
                                      handleInputChange(partida.id, "set2", "gamesDupla1", e.target.value)
                                    }
                                    placeholder="0"
                                    disabled={loading || precisaDefinirJogadores}
                                  />
                                </InputGroup>

                                <InputGroup>
                                  <InputLabel>{partida.equipe2Nome}</InputLabel>
                                  <ScoreInput
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={resultado?.set2?.gamesDupla2 ?? ""}
                                    onChange={(e) =>
                                      handleInputChange(partida.id, "set2", "gamesDupla2", e.target.value)
                                    }
                                    placeholder="0"
                                    disabled={loading || precisaDefinirJogadores}
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
                                  <InputLabel>{partida.equipe1Nome}</InputLabel>
                                  <ScoreInput
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={resultado?.set3?.gamesDupla1 ?? ""}
                                    onChange={(e) =>
                                      handleInputChange(partida.id, "set3", "gamesDupla1", e.target.value)
                                    }
                                    placeholder="0"
                                    disabled={loading || precisaDefinirJogadores}
                                  />
                                </InputGroup>

                                <InputGroup>
                                  <InputLabel>{partida.equipe2Nome}</InputLabel>
                                  <ScoreInput
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={resultado?.set3?.gamesDupla2 ?? ""}
                                    onChange={(e) =>
                                      handleInputChange(partida.id, "set3", "gamesDupla2", e.target.value)
                                    }
                                    placeholder="0"
                                    disabled={loading || precisaDefinirJogadores}
                                  />
                                </InputGroup>
                              </PlacarGrid>
                            </>
                          )}
                        </>
                      );
                    })()}

                    {erro && <ErrorText>{erro}</ErrorText>}
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
              <Button type="button" $variant="secondary" onClick={onClose} disabled={loading}>
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

      {/* Modal para definir jogadores */}
      {partidaParaDefinirJogadores && equipe1 && equipe2 && (
        <ModalDefinirJogadoresPartida
          isOpen={true}
          partida={partidaParaDefinirJogadores}
          equipe1Nome={equipe1.nome}
          equipe2Nome={equipe2.nome}
          equipe1Jogadores={equipe1.jogadores}
          equipe2Jogadores={equipe2.jogadores}
          partidasConfrontoComJogadores={partidasAtuais}
          onClose={() => setPartidaParaDefinirJogadores(null)}
          onConfirm={async (dupla1Ids, dupla2Ids) => {
            await teamsService.definirJogadoresPartida(
              etapaId,
              partidaParaDefinirJogadores.id,
              dupla1Ids,
              dupla2Ids
            );
            await handleJogadoresDefinidos();
          }}
        />
      )}
    </Overlay>
  );
};

export default ModalLancamentoResultadosLoteTeams;
