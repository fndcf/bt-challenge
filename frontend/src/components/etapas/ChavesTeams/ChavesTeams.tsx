import React, { useState } from "react";
import { Alert, Button, LoadingOverlay, Tabs } from "@/components/ui";
import {
  AcoesChaves,
  CabecalhoChaves,
  EstadoChaves,
  TelaChaves,
} from "@/components/torneio";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { FaseEtapa } from "@/types/chave";
import { FormatoEtapa } from "@/types/etapa";
import {
  ConfrontoEquipe,
  TipoFormacaoJogos,
  VarianteTeams,
} from "@/types/teams";
import { getVarianteTeamsInfo } from "@/utils/teams";
import { ModalLancamentoResultadosLoteTeams } from "../ModalLancamentoResultadosLoteTeams";
import { ModalDefinirJogadoresPartida } from "../ModalDefinirJogadoresPartida";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";
import { ConfrontoTeams } from "./components/ConfrontoTeams";
import { EliminatoriaTeams } from "./components/EliminatoriaTeams";
import { GrupoTeamsPainel } from "./components/GrupoTeamsPainel";
import { useChavesTeams } from "./hooks/useChavesTeams";

interface ChavesTeamsProps {
  etapaId: string;
  arenaId?: string;
  varianteTeams?: VarianteTeams;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  melhorDe3Eliminatoria?: boolean;
  onAtualizar?: () => void;
}

type AbaAtiva = "grupos" | "eliminatoria";

export const ChavesTeams: React.FC<ChavesTeamsProps> = ({
  etapaId,
  varianteTeams,
  tipoFormacaoJogos,
  etapaFinalizada = false,
  melhorDe3 = false,
  melhorDe3Eliminatoria = false,
  onAtualizar,
}) => {
  const chaves = useChavesTeams({ etapaId, onAtualizar });
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("grupos");
  const [temEmpatePendente, setTemEmpatePendente] = useState(false);
  const [confirmacao, setConfirmacao] = useState<
    "encerrarEtapa" | "cancelarEliminatoria" | null
  >(null);
  const fecharConfirmacao = () => setConfirmacao(null);

  if (chaves.loading || chaves.error || chaves.equipes.length === 0) {
    return (
      <EstadoChaves
        carregando={chaves.loading}
        erro={chaves.error}
        vazio="Nenhuma equipe gerada ainda"
      />
    );
  }

  const { modalResultados, modalJogadores, temFaseGrupos } = chaves;
  const variante = getVarianteTeamsInfo(varianteTeams);
  const totalEliminatoria = chaves.confrontosEliminatoria.length;

  const abas: { id: AbaAtiva; label: string }[] = [
    {
      id: "grupos",
      label: `Fase de Grupos (${chaves.confrontosGrupos.length})`,
    },
  ];
  if (totalEliminatoria > 0) {
    abas.push({
      id: "eliminatoria",
      label: `Eliminatória (${totalEliminatoria})`,
    });
  }

  const renderConfronto = (confronto: ConfrontoEquipe) => {
    const partidas = chaves.partidasPorConfronto.get(confronto.id) ?? [];

    return (
      <ConfrontoTeams
        key={confronto.id}
        confronto={confronto}
        partidas={partidas}
        expandido={chaves.confrontoExpandido === confronto.id}
        varianteTeams={varianteTeams}
        etapaFinalizada={etapaFinalizada}
        resultadosBloqueados={
          confronto.fase === FaseEtapa.GRUPOS && chaves.eliminatoriaGerada
        }
        onResultados={() => chaves.abrirResultados(confronto)}
        onGerarDecider={() => chaves.gerarDecider(confronto)}
        onAlternar={() => chaves.alternarConfronto(confronto)}
        onDefinirJogadores={(partida) =>
          chaves.abrirJogadores(partida, confronto, partidas)
        }
      />
    );
  };

  return (
    <TelaChaves>
      {!etapaFinalizada && chaves.todosFinalizados && (
        <AcoesChaves>
          <Button
            onClick={() => setConfirmacao("encerrarEtapa")}
            disabled={temEmpatePendente}
            title={
              temEmpatePendente
                ? "Resolva o empate na classificação para encerrar"
                : undefined
            }
          >
            Encerrar Etapa
          </Button>
        </AcoesChaves>
      )}

      {etapaFinalizada && (
        <Alert variant="warning">
          Esta etapa foi encerrada. Os resultados não podem mais ser alterados.
        </Alert>
      )}

      {/* Eliminatória só é preenchida depois que os empates dos grupos forem resolvidos */}
      <PainelEmpatesPendentes
        etapaId={etapaId}
        atualizarEm={chaves.equipes}
        onResolvido={() => chaves.carregarDados(true)}
        desabilitado={etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

      <CabecalhoChaves
        titulo={variante.nome}
        selo="Equipes"
        formato={FormatoEtapa.TEAMS}
        resumo={`${chaves.equipes.length} equipes • ${chaves.confrontos.length} confrontos (${chaves.finalizados} finalizados)`}
      />

      <Tabs
        rotulo="Fases da etapa"
        formato={FormatoEtapa.TEAMS}
        abas={abas}
        ativa={abaAtiva}
        onChange={setAbaAtiva}
      />

      {abaAtiva === "grupos" ? (
        <>
          {chaves.grupos.map((grupo) => (
            <GrupoTeamsPainel
              key={grupo.id}
              grupo={grupo}
              podeRenomear={!etapaFinalizada}
              onRenomear={chaves.renomearEquipe}
              renderConfronto={renderConfronto}
            />
          ))}

          <Alert title={`Formato ${variante.nome}`}>
            <p>
              {`Campeonato por equipes onde cada equipe tem ${variante.jogadoresPorEquipe} jogadores.`}
              {temFaseGrupos
                ? " Com 6+ equipes: fase de grupos + eliminatórias (top 2 de cada grupo)."
                : " As equipes jogam todas contra todas (round-robin)."}
            </p>
            <ul>
              <li>
                {`Cada confronto tem ${variante.jogosPorConfronto} jogos${
                  varianteTeams === VarianteTeams.TEAMS_4
                    ? " (+1 decider se empate 1-1)"
                    : ""
                }`}
              </li>
              <li>Vitória no confronto = 3 pontos</li>
              <li>Desempate: saldo de jogos, depois saldo de games</li>
              {temFaseGrupos && (
                <li>Os 2 melhores de cada grupo vão para as eliminatórias</li>
              )}
            </ul>
          </Alert>
        </>
      ) : (
        <EliminatoriaTeams
          confrontos={chaves.confrontosEliminatoria}
          gerada={chaves.eliminatoriaGerada}
          gruposConcluidos={chaves.gruposConcluidos}
          temEmpatePendente={temEmpatePendente}
          etapaFinalizada={etapaFinalizada}
          onGerar={chaves.gerarEliminatoria}
          onCancelar={() => setConfirmacao("cancelarEliminatoria")}
          renderConfronto={renderConfronto}
        />
      )}

      <LoadingOverlay
        isLoading={chaves.operacao !== null}
        message={chaves.operacao ?? ""}
      />

      {modalResultados && (
        <ModalLancamentoResultadosLoteTeams
          etapaId={etapaId}
          confronto={modalResultados.confronto}
          partidas={modalResultados.partidas}
          equipes={chaves.equipes}
          tipoFormacaoManual={tipoFormacaoJogos === TipoFormacaoJogos.MANUAL}
          etapaFinalizada={etapaFinalizada}
          melhorDe3={
            melhorDe3 &&
            (modalResultados.confronto.fase === FaseEtapa.GRUPOS ||
              melhorDe3Eliminatoria)
          }
          onClose={chaves.fecharResultados}
          onSuccess={chaves.concluirResultados}
        />
      )}

      {modalJogadores && (
        <ModalDefinirJogadoresPartida
          isOpen
          partida={modalJogadores.partida}
          equipe1Nome={modalJogadores.equipe1.nome}
          equipe2Nome={modalJogadores.equipe2.nome}
          equipe1Jogadores={modalJogadores.equipe1.jogadores}
          equipe2Jogadores={modalJogadores.equipe2.jogadores}
          partidasConfrontoComJogadores={modalJogadores.partidasConfronto}
          onClose={chaves.fecharJogadores}
          onConfirm={chaves.confirmarJogadores}
        />
      )}

      <ConfirmacaoAcao
        acao="encerrarEtapa"
        isOpen={confirmacao === "encerrarEtapa"}
        onConfirm={() => chaves.encerrarEtapa(fecharConfirmacao)}
        onClose={fecharConfirmacao}
      />
      <ConfirmacaoAcao
        acao="cancelarEliminatoria"
        isOpen={confirmacao === "cancelarEliminatoria"}
        onConfirm={() => chaves.cancelarEliminatoria(fecharConfirmacao)}
        onClose={fecharConfirmacao}
      />
    </TelaChaves>
  );
};

export default ChavesTeams;
