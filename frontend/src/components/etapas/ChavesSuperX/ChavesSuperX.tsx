import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getSuperXService, getEtapaService } from "@/services";
import { Grupo } from "@/types/chave";
import { EstatisticasJogador, PartidaReiDaPraia } from "@/types/reiDaPraia";
import { FormatoEtapa, VarianteSuperX } from "@/types/etapa";
import { ModalLancamentoResultadosLoteSuperX } from "../ModalLancamentoResultadosLoteSuperX";
import { LoadingOverlay, Button, EmptyState } from "@/components/ui";
import { GrupoPainel, TabelaClassificacao } from "@/components/torneio";
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

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #581c87;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const VarianteBadge = styled.span`
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Stats = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const Spinner = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
`;

const InfoCard = styled.div`
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;

  h4 {
    color: #1e40af;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
  }

  p {
    color: #1e40af;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    color: #1e40af;
    font-size: 0.875rem;
  }

  li {
    margin-top: 0.25rem;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const AlertBox = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

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

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <strong>Erro:</strong> {error}
        </ErrorContainer>
      </Container>
    );
  }

  if (!grupo) {
    return (
      <Container>
        <EmptyState titulo="Nenhuma chave gerada ainda" />
      </Container>
    );
  }

  // Calcular total de partidas baseado na variante
  const totalPartidas =
    varianteSuperX === VarianteSuperX.SUPER_12
      ? varianteInfo.rodadas * 3 // Super 12: 3 partidas por rodada
      : varianteInfo.rodadas * 2; // Super 8: 2 partidas por rodada

  const linhas = linhasDeJogadores(jogadores);

  return (
    <Container>
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
          <ActionsRow>
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
          </ActionsRow>
        )}

      {etapaFinalizada && (
        <AlertBox>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Esta etapa foi encerrada. Os resultados não podem mais ser
            alterados.
          </span>
        </AlertBox>
      )}

      <Header>
        <Title>
          {varianteInfo.nome}
          <VarianteBadge>Grupo Unico</VarianteBadge>
        </Title>
        <Stats>
          {jogadores.length} jogadores • {varianteInfo.rodadas} rodadas •{" "}
          {totalPartidas} partidas
        </Stats>
      </Header>

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

      <InfoCard>
        <h4>Formato {varianteInfo.nome}</h4>
        <p>
          Torneio com grupo unico onde cada jogador forma duplas diferentes a
          cada rodada. Sao {varianteInfo.rodadas} rodadas, garantindo que cada
          jogador jogue com todos os outros como parceiro.
        </p>
        <ul>
          <li>
            Classificacao por pontos (3 por vitoria), depois saldo de games
          </li>
          <li>Todos os jogadores jogam em todas as rodadas</li>
          <li>Nao ha fase eliminatoria - o campeonato e decidido no grupo</li>
        </ul>
      </InfoCard>

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
    </Container>
  );
};

export default ChavesSuperX;
