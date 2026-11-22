/**
 * Modal para definir jogadores de uma partida vazia (formação manual)
 * Permite selecionar quais jogadores de cada equipe irão jogar
 */

import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import { Alert, Button, Modal } from "@/components/ui";
import { SeloGenero } from "@/components/jogadores/Genero";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import { PartidaTeams, JogadorEquipe } from "@/types/teams";
import { getMensagemErro } from "@/utils/erro";

interface ModalDefinirJogadoresPartidaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dupla1Ids: [string, string], dupla2Ids: [string, string]) => Promise<void>;
  partida: PartidaTeams;
  equipe1Nome: string;
  equipe2Nome: string;
  equipe1Jogadores: JogadorEquipe[];
  equipe2Jogadores: JogadorEquipe[];
  partidasConfrontoComJogadores: PartidaTeams[]; // Para validar duplas já usadas
}

// ============== STYLED COMPONENTS ==============

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const EquipesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: ${theme.spacing[4]};
`;

const EquipeCard = styled.div`
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
`;

const EquipeHeader = styled.div`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  background: ${getCoresFormato(FormatoEtapa.TEAMS).solido};
  color: ${texto.inverso};
  font-weight: ${fontWeight.semibold};
  text-align: center;
`;

const JogadoresContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[3]};
`;

const JogadorOpcao = styled.label<{ $selecionado: boolean; $bloqueado: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  min-height: 44px;
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid
    ${({ $selecionado }) => ($selecionado ? acao.primaria : superficie.borda)};
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $selecionado, $bloqueado }) => {
    if ($selecionado) return acao.fundoClaro;
    return $bloqueado ? superficie.pagina : superficie.fundo;
  }};
  color: ${({ $bloqueado }) =>
    $bloqueado ? texto.secundario : texto.principal};
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.medium};
  cursor: ${({ $bloqueado }) => ($bloqueado ? "not-allowed" : "pointer")};

  &:focus-within {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  input {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    accent-color: ${acao.primaria};
    cursor: inherit;
  }
`;

const JogadorNome = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const MotivoBloqueio = styled.span`
  font-size: ${fontSize.xs};
  color: ${status.erro.texto};
`;

// ============== HELPERS ==============

const TIPO_PARTIDA: Record<string, string> = {
  feminino: "Partida Feminina",
  masculino: "Partida Masculina",
  misto: "Partida Mista",
  decider: "Partida Decider",
};

const chaveDupla = (ids: string[]): string => [...ids].sort().join("-");

// ============== COMPONENT ==============

export const ModalDefinirJogadoresPartida: React.FC<ModalDefinirJogadoresPartidaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  partida,
  equipe1Nome,
  equipe2Nome,
  equipe1Jogadores,
  equipe2Jogadores,
  partidasConfrontoComJogadores,
}) => {
  const [selectedEquipe1, setSelectedEquipe1] = useState<string[]>([]);
  const [selectedEquipe2, setSelectedEquipe2] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-preencher com jogadores existentes (modo edição)
  useEffect(() => {
    if (isOpen) {
      if (partida.dupla1?.length > 0) {
        setSelectedEquipe1(partida.dupla1.map((j) => j.id));
      } else {
        setSelectedEquipe1([]);
      }
      if (partida.dupla2?.length > 0) {
        setSelectedEquipe2(partida.dupla2.map((j) => j.id));
      } else {
        setSelectedEquipe2([]);
      }
      setError(null);
    }
  }, [isOpen, partida]);

  // Obter duplas e jogadores já usados no confronto
  const { duplasUsadas, jogadoresUsados } = useMemo(() => {
    const duplas = new Set<string>();
    const jogadores = new Set<string>();
    const isDecider = partida.tipoJogo === "decider";

    for (const p of partidasConfrontoComJogadores) {
      if (p.id === partida.id) continue; // Ignorar partida atual

      // Decider: só a dupla não pode repetir. Nas demais, nem o jogador
      const validaJogadores = !isDecider && p.tipoJogo !== "decider";

      for (const dupla of [p.dupla1, p.dupla2]) {
        if (dupla.length !== 2) continue;
        const ids = dupla.map((j) => j.id);
        duplas.add(chaveDupla(ids));
        if (validaJogadores) ids.forEach((id) => jogadores.add(id));
      }
    }

    return { duplasUsadas: duplas, jogadoresUsados: jogadores };
  }, [partidasConfrontoComJogadores, partida.id, partida.tipoJogo]);

  // Verificar se um jogador já participou do confronto
  const isJogadorJaJogou = (jogadorId: string): boolean => {
    const isDecider = partida.tipoJogo === "decider";
    // No decider, jogadores podem repetir, apenas duplas não
    if (isDecider) return false;
    return jogadoresUsados.has(jogadorId);
  };

  // Verificar se uma dupla já foi usada
  const isDuplaUsada = (jogadorId: string, outroJogadorId?: string): boolean =>
    !!outroJogadorId && duplasUsadas.has(chaveDupla([jogadorId, outroJogadorId]));

  const alternarJogador = (
    jogadorId: string,
    selecionados: string[],
    setSelecionados: (ids: string[]) => void
  ) => {
    setError(null);

    if (selecionados.includes(jogadorId)) {
      setSelecionados(selecionados.filter((id) => id !== jogadorId));
      return;
    }
    if (selecionados.length >= 2) {
      setError("Selecione apenas 2 jogadores por equipe");
      return;
    }
    if (isJogadorJaJogou(jogadorId)) {
      setError("Este jogador já participou de uma partida neste confronto");
      return;
    }
    if (isDuplaUsada(jogadorId, selecionados[0])) {
      setError("Esta dupla já jogou neste confronto");
      return;
    }
    setSelecionados([...selecionados, jogadorId]);
  };

  const handleConfirm = async () => {
    if (selectedEquipe1.length !== 2 || selectedEquipe2.length !== 2) {
      setError("Selecione exatamente 2 jogadores de cada equipe");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(
        selectedEquipe1 as [string, string],
        selectedEquipe2 as [string, string]
      );

      // Resetar estado
      setSelectedEquipe1([]);
      setSelectedEquipe2([]);
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao definir jogadores"));
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedEquipe1([]);
    setSelectedEquipe2([]);
    setError(null);
    onClose();
  };

  const canConfirm = selectedEquipe1.length === 2 && selectedEquipe2.length === 2 && !loading;

  const equipeMista =
    new Set(equipe1Jogadores.concat(equipe2Jogadores).map((j) => j.genero))
      .size > 1;

  const renderEquipe = (
    nome: string,
    jogadores: JogadorEquipe[],
    selecionados: string[],
    setSelecionados: (ids: string[]) => void
  ) => (
    <EquipeCard>
      <EquipeHeader>
        {nome} ({selecionados.length}/2)
      </EquipeHeader>
      <JogadoresContainer>
        {jogadores.map((jogador) => {
          const selecionado = selecionados.includes(jogador.id);
          const equipeCheia = !selecionado && selecionados.length >= 2;
          const jaJogou = isJogadorJaJogou(jogador.id);
          const duplaUsada = isDuplaUsada(
            jogador.id,
            selecionados.find((id) => id !== jogador.id)
          );
          const bloqueado = equipeCheia || jaJogou || duplaUsada;

          return (
            <JogadorOpcao
              key={jogador.id}
              $selecionado={selecionado}
              $bloqueado={bloqueado}
            >
              <input
                type="checkbox"
                checked={selecionado}
                onChange={() =>
                  alternarJogador(jogador.id, selecionados, setSelecionados)
                }
                disabled={bloqueado}
              />
              <JogadorNome>{jogador.nome}</JogadorNome>
              {equipeMista && <SeloGenero genero={jogador.genero} />}
              {jaJogou && <MotivoBloqueio>Já jogou</MotivoBloqueio>}
              {!jaJogou && duplaUsada && (
                <MotivoBloqueio>Dupla já usada</MotivoBloqueio>
              )}
            </JogadorOpcao>
          );
        })}
      </JogadoresContainer>
    </EquipeCard>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Definir Jogadores da Partida"
      subtitle={[
        partida.tipoJogo && TIPO_PARTIDA[partida.tipoJogo],
        `${equipe1Nome} vs ${equipe2Nome}`,
      ]
        .filter(Boolean)
        .join(" - ")}
      loading={loading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </>
      }
    >
      <Container>
        <Alert>
          Selecione 2 jogadores de cada equipe para formar as duplas desta
          partida. As duplas não podem se repetir no mesmo confronto.
        </Alert>

        {error && (
          <div role="alert">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <EquipesContainer>
          {renderEquipe(
            equipe1Nome,
            equipe1Jogadores,
            selectedEquipe1,
            setSelectedEquipe1
          )}
          {renderEquipe(
            equipe2Nome,
            equipe2Jogadores,
            selectedEquipe2,
            setSelectedEquipe2
          )}
        </EquipesContainer>
      </Container>
    </Modal>
  );
};

export default ModalDefinirJogadoresPartida;
