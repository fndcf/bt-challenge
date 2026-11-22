import React, { useState } from "react";
import styled from "styled-components";
import { Button } from "@/components/ui";
import {
  CampoPlacar,
  ListaPlacares,
  ModalResultadosLote,
} from "@/components/torneio";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import { getTeamsService } from "@/services";
import {
  PartidaTeams,
  ConfrontoEquipe,
  Equipe,
  StatusPartidaTeams,
} from "@/types/teams";
import { SeloTipoJogo } from "../ChavesTeams/components/SeloTipoJogo";
import { ModalDefinirJogadoresPartida } from "../ModalDefinirJogadoresPartida";
import { useResultadosLote } from "@/hooks/useResultadosLote";
import { getSituacaoPartida } from "@/utils/resultadosLote";

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

// ============== STYLED COMPONENTS ==============

const { status, texto } = theme.semantic;

const ConfrontoBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[4]};
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.lg};
  background: ${getCoresFormato(FormatoEtapa.TEAMS).solido};
  color: ${texto.inverso};
  font-weight: ${theme.typography.fontWeight.bold};
`;

const PlacarConfronto = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.xl};
`;

const AvisoJogadores = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[3]};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${status.aviso.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${status.aviso.fundo};
  color: ${status.aviso.texto};
  font-size: ${theme.typography.fontSize.sm};
`;

// ============== HELPERS ==============

/** Nomes da dupla com a equipe embaixo; sem dupla, só a equipe */
const montarLado = (
  partida: PartidaTeams,
  confronto: ConfrontoEquipe,
  lado: 1 | 2
): { nome: string; detalhe?: string } => {
  const dupla = lado === 1 ? partida.dupla1 : partida.dupla2;
  // A cópia do nome na partida pode faltar (decider) ou estar antiga
  const equipe =
    lado === 1
      ? confronto.equipe1Nome || partida.equipe1Nome
      : confronto.equipe2Nome || partida.equipe2Nome;

  if (!dupla || dupla.length === 0) {
    return { nome: equipe || "A definir" };
  }

  return { nome: dupla.map((j) => j.nome).join(" / "), detalhe: equipe };
};

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteTeams: React.FC<
  ModalLancamentoResultadosLoteTeamsProps
> = ({ etapaId, confronto, partidas, equipes, tipoFormacaoManual = false, etapaFinalizada = false, melhorDe3 = false, onClose, onSuccess }) => {
  const teamsService = getTeamsService();
  const [partidaParaDefinirJogadores, setPartidaParaDefinirJogadores] = useState<PartidaTeams | null>(null);
  const [partidasAtuais, setPartidasAtuais] = useState<PartidaTeams[]>(partidas);
  const semJogadores = (partida?: PartidaTeams): boolean =>
    tipoFormacaoManual && !!partida && !partida.dupla1?.length;

  const {
    resultados,
    erros,
    erroGlobal,
    loading,
    seraoSalvas,
    alterarPlacar,
    handleSubmit,
  } = useResultadosLote({
    partidas: partidasAtuais,
    melhorDe3,
    onSuccess,
    enviar: (lote) => teamsService.registrarResultadosEmLote(etapaId, lote),
    validarPartida: (partidaId) =>
      semJogadores(partidasAtuais.find((p) => p.id === partidaId))
        ? "Defina os jogadores antes de registrar o resultado"
        : undefined,
  });

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
  const precisamJogadores = partidasAtuais.filter(semJogadores).length;

  // Encontrar as equipes
  const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
  const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);

  return (
    <>
      <ModalResultadosLote
        contexto="Confronto"
        totalPartidas={totalPartidas}
        jaFinalizadas={jaFinalizadas}
        seraoSalvas={seraoSalvas}
        resumoExtra={
          precisamJogadores > 0
            ? [{ rotulo: "Sem Jogadores", valor: precisamJogadores }]
            : []
        }
        erroGlobal={erroGlobal}
        loading={loading}
        etapaFinalizada={etapaFinalizada}
        // Com o modal de definir jogadores aberto, o Esc fecha só ele
        closeOnEscape={!partidaParaDefinirJogadores}
        onClose={onClose}
        onSubmit={handleSubmit}
      >
        <ConfrontoBox>
          <span>{confronto.equipe1Nome}</span>
          <PlacarConfronto>
            <span>{confronto.jogosEquipe1}</span>
            <span>x</span>
            <span>{confronto.jogosEquipe2}</span>
          </PlacarConfronto>
          <span>{confronto.equipe2Nome}</span>
        </ConfrontoBox>

        <ListaPlacares>
          {partidasAtuais.map((partida, index) => {
            const precisaDefinirJogadores = semJogadores(partida);

            return (
              <CampoPlacar
                key={partida.id}
                titulo={`JOGO ${index + 1}`}
                etiquetas={<SeloTipoJogo tipo={partida.tipoJogo} />}
                situacao={getSituacaoPartida(partida.status)}
                lado1={montarLado(partida, confronto, 1)}
                lado2={montarLado(partida, confronto, 2)}
                placar={resultados.get(partida.id)}
                melhorDe3={melhorDe3}
                onChange={(...args) => alterarPlacar(partida.id, ...args)}
                disabled={loading || precisaDefinirJogadores}
                erro={erros.get(partida.id)}
              >
                {precisaDefinirJogadores && (
                  <AvisoJogadores>
                    <span>Jogadores não definidos</span>
                    <Button type="button" size="sm" onClick={() => handleDefinirJogadores(partida)}>
                      Definir Jogadores
                    </Button>
                  </AvisoJogadores>
                )}
              </CampoPlacar>
            );
          })}
        </ListaPlacares>
      </ModalResultadosLote>

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
    </>
  );
};

export default ModalLancamentoResultadosLoteTeams;
