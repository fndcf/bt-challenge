import React, { useState, useEffect } from "react";
import { getSuperXService, getEtapaService } from "@/services";
import { Grupo } from "@/types/chave";
import { EstatisticasJogador, PartidaReiDaPraia } from "@/types/reiDaPraia";
import { FormatoEtapa, VarianteSuperX } from "@/types/etapa";
import { ModalLancamentoResultadosLoteSuperX } from "../ModalLancamentoResultadosLoteSuperX";
import { Alert, Button, EmptyState, LoadingOverlay } from "@/components/ui";
import {
  AcoesChaves,
  CabecalhoChaves,
  EstadoChaves,
  GrupoPainel,
  TabelaClassificacao,
  TelaChaves,
} from "@/components/torneio";
import {
  COLUNAS_ADMIN,
  linhasDeJogadores,
  temJogos,
} from "@/utils/classificacao";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";
import { invalidateRankingCache } from "@/components/jogadores/RankingList";

interface ChavesSuperXProps {
  etapaId: string;
  arenaId?: string;
  varianteSuperX?: VarianteSuperX;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  onAtualizar?: () => void;
}

// ============== HELPERS ==============

const getVarianteInfo = (
  variante?: VarianteSuperX
): { nome: string; rodadas: number } => {
  switch (variante) {
    case VarianteSuperX.SUPER_8:
      return { nome: "Super 8", rodadas: 7 };
    case VarianteSuperX.SUPER_12:
      return { nome: "Super 12", rodadas: 11 };
    default:
      return { nome: "Super X", rodadas: 0 };
  }
};

// ============== COMPONENTE ==============

export const ChavesSuperX: React.FC<ChavesSuperXProps> = ({
  etapaId,
  varianteSuperX,
  etapaFinalizada = false,
  melhorDe3 = false,
  onAtualizar,
}) => {
  const superXService = getSuperXService();
  const etapaService = getEtapaService();
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [jogadores, setJogadores] = useState<EstatisticasJogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partidas, setPartidas] = useState<PartidaReiDaPraia[]>([]);
  const [mostrarModalResultados, setMostrarModalResultados] = useState(false);
  const [modalEncerrarAberto, setModalEncerrarAberto] = useState(false);
  const [temEmpatePendente, setTemEmpatePendente] = useState(false);

  // Estado global de loading para operações críticas que bloqueiam toda a tela
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState("");

  const varianteInfo = getVarianteInfo(varianteSuperX);

  useEffect(() => {
    carregarChaves();
  }, [etapaId]);

  const carregarChaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const [grupoData, jogadoresData] = await Promise.all([
        superXService.buscarGrupo(etapaId),
        superXService.buscarJogadores(etapaId),
      ]);

      setGrupo(grupoData);
      setJogadores(jogadoresData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar chaves");
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModalResultados = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Carregando partidas...");
      const partidasData = await superXService.buscarPartidas(etapaId);
      setPartidas(partidasData);
      setMostrarModalResultados(true);
    } catch (err: any) {
      alert(err.message || "Erro ao carregar partidas");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const handleResultadosSalvos = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Atualizando classificação...");
      setMostrarModalResultados(false);
      await carregarChaves();
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const encerrarEtapa = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Encerrando etapa...");
      await etapaService.encerrarEtapa(etapaId);
      invalidateRankingCache();
      setModalEncerrarAberto(false);
      if (onAtualizar) {
        await onAtualizar();
      }
    } catch (err: any) {
      alert(err.message || "Erro ao encerrar etapa");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  if (loading || error || !grupo) {
    return (
      <EstadoChaves
        carregando={loading}
        erro={error}
        vazio="Nenhuma chave gerada ainda"
      />
    );
  }

  // Calcular total de partidas baseado na variante
  const totalPartidas =
    varianteSuperX === VarianteSuperX.SUPER_12
      ? varianteInfo.rodadas * 3 // Super 12: 3 partidas por rodada
      : varianteInfo.rodadas * 2; // Super 8: 2 partidas por rodada

  const linhas = linhasDeJogadores(jogadores);

  return (
    <TelaChaves>
      {/* Posição define a pontuação: empates precisam de decisão antes de encerrar */}
      <PainelEmpatesPendentes
        etapaId={etapaId}
        atualizarEm={jogadores}
        onResolvido={carregarChaves}
        desabilitado={etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

      {/* Botão de Encerrar Etapa no topo - só aparece quando todas as partidas estiverem finalizadas */}
      {!etapaFinalizada &&
        grupo &&
        (grupo.partidasFinalizadas || 0) === totalPartidas &&
        totalPartidas > 0 && (
          <AcoesChaves>
            <Button
              onClick={() => setModalEncerrarAberto(true)}
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

      <CabecalhoChaves
        titulo={varianteInfo.nome}
        selo="Grupo Único"
        formato={FormatoEtapa.SUPER_X}
        resumo={`${jogadores.length} jogadores • ${varianteInfo.rodadas} rodadas • ${totalPartidas} partidas`}
      />

      <GrupoPainel
        formato={FormatoEtapa.SUPER_X}
        nome={grupo.nome || "Grupo Principal"}
        etiquetas={[`${linhas.length} jogadores`]}
        progresso={`${grupo.partidasFinalizadas || 0} / ${totalPartidas} partidas`}
        completo={grupo.completo}
        acao={
          <Button
            fullWidth
            onClick={handleAbrirModalResultados}
            disabled={etapaFinalizada}
          >
            Registrar Resultados
          </Button>
        }
      >
        {linhas.length === 0 ? (
          <EmptyState titulo="Nenhum jogador neste grupo" />
        ) : (
          <TabelaClassificacao
            formato={FormatoEtapa.SUPER_X}
            legenda="Classificação da etapa"
            rotuloNome="Jogador"
            colunas={COLUNAS_ADMIN}
            linhas={linhas}
            mostrarEstatisticas={temJogos(linhas)}
          />
        )}
      </GrupoPainel>

      <Alert title={`Formato ${varianteInfo.nome}`}>
        <p>
          Torneio com grupo único onde cada jogador forma duplas diferentes a
          cada rodada. São {varianteInfo.rodadas} rodadas, garantindo que cada
          jogador jogue com todos os outros como parceiro.
        </p>
        <ul>
          <li>
            Classificação por pontos (3 por vitória), depois saldo de games
          </li>
          <li>Todos os jogadores jogam em todas as rodadas</li>
          <li>Não há fase eliminatória - o campeonato é decidido no grupo</li>
        </ul>
      </Alert>

      {/* Modal de Lançamento de Resultados em Lote */}
      {mostrarModalResultados && (
        <ModalLancamentoResultadosLoteSuperX
          partidas={partidas}
          etapaFinalizada={etapaFinalizada}
          melhorDe3={melhorDe3}
          onClose={() => setMostrarModalResultados(false)}
          onSuccess={handleResultadosSalvos}
        />
      )}

      {/* Loading Overlay Global - Bloqueia toda a tela */}
      <LoadingOverlay
        isLoading={globalLoading}
        message={globalLoadingMessage}
      />

      {/* Modal de Confirmação para Encerrar Etapa */}
      <ConfirmacaoAcao
        acao="encerrarEtapa"
        isOpen={modalEncerrarAberto}
        onConfirm={encerrarEtapa}
        onClose={() => setModalEncerrarAberto(false)}
      />
    </TelaChaves>
  );
};

export default ChavesSuperX;
