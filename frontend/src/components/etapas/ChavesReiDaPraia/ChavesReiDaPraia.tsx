import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getReiDaPraiaService } from "@/services";
import { Grupo } from "@/types/chave";
import {
  EstatisticasJogador,
  TipoChaveamentoReiDaPraia,
  PartidaReiDaPraia,
} from "@/types/reiDaPraia";
import { FaseEliminatoriaReiDaPraia } from "../FaseEliminatoriaReiDaPraia";
import { LoadingOverlay, Button, EmptyState } from "@/components/ui";
import { GrupoPainel, GruposGrid, TabelaClassificacao } from "@/components/torneio";
import { FormatoEtapa } from "@/types/etapa";
import {
  COLUNAS_ADMIN,
  linhasDeJogadores,
  temJogos,
} from "@/utils/classificacao";
import { ModalLancamentoResultadosLoteReiDaPraia } from "../ModalLancamentoResultadosLoteReiDaPraia";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";

interface ChavesReiDaPraiaProps {
  etapaId: string;
  arenaId?: string;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  melhorDe3Eliminatoria?: boolean;
}

type AbaAtiva = "grupos" | "eliminatoria";

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const TabsContainer = styled.div`
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;

  /* MOBILE: Remove borda */
  @media (max-width: 768px) {
    border-bottom: none;
  }
`;

const TabsList = styled.nav`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  /* MOBILE: Layout vertical */
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Tab = styled.button<{ $isActive: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  border-bottom: 3px solid
    ${(props) => (props.$isActive ? "#7c3aed" : "transparent")};
  color: ${(props) => (props.$isActive ? "#7c3aed" : "#6b7280")};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: #7c3aed;
  }

  /* MOBILE: Botões verticais */
  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    background: ${(props) => (props.$isActive ? "#faf5ff" : "white")};
    border-color: ${(props) => (props.$isActive ? "#7c3aed" : "#e5e7eb")};
    border-bottom: 1px solid
      ${(props) => (props.$isActive ? "#7c3aed" : "#e5e7eb")};

    &:hover {
      background: ${(props) => (props.$isActive ? "#faf5ff" : "#f9fafb")};
    }
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

// ============== HELPERS ==============

// ============== COMPONENTE ==============

export const ChavesReiDaPraia: React.FC<ChavesReiDaPraiaProps> = ({
  etapaId,
  arenaId,
  tipoChaveamento,
  etapaFinalizada = false,
  melhorDe3 = false,
  melhorDe3Eliminatoria = false,
}) => {
  const reiDaPraiaService = getReiDaPraiaService();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [jogadores, setJogadores] = useState<EstatisticasJogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_eliminatoriaExiste, setEliminatoriaExiste] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("grupos");
  const [temEmpatePendente, setTemEmpatePendente] = useState(false);

  // Estado global de loading para operações críticas que bloqueiam toda a tela
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = React.useState("");

  // Estado para modal de lançamento em lote
  const [grupoModalAberto, setGrupoModalAberto] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [partidasModal, setPartidasModal] = useState<PartidaReiDaPraia[]>([]);

  useEffect(() => {
    carregarChaves();
  }, [etapaId, abaAtiva]);

  const carregarChaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gruposData, jogadoresData] = await Promise.all([
        reiDaPraiaService.buscarGrupos(etapaId),
        reiDaPraiaService.buscarJogadores(etapaId),
      ]);

      setGrupos(gruposData);
      setJogadores(jogadoresData);

      // Verificar se existe fase eliminatória
      try {
        const confrontos =
          await reiDaPraiaService.buscarConfrontosEliminatorios(etapaId);
        setEliminatoriaExiste(confrontos && confrontos.length > 0);
      } catch {
        setEliminatoriaExiste(false);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar chaves");
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModalResultados = async (
    grupoId: string,
    grupoNome: string
  ) => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Carregando partidas...");

      const todasPartidas = await reiDaPraiaService.buscarPartidas(etapaId);
      const partidasDoGrupo = todasPartidas.filter(
        (p) => p.grupoId === grupoId
      );

      setPartidasModal(partidasDoGrupo);
      setGrupoModalAberto({ id: grupoId, nome: grupoNome });
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
      setGrupoModalAberto(null);
      await carregarChaves();
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

  if (grupos.length === 0) {
    return (
      <Container>
        <EmptyState titulo="Nenhuma chave gerada ainda" />
      </Container>
    );
  }

  // Calcular total de partidas (3 por grupo)
  const totalPartidas = grupos.length * 3;

  return (
    <Container>
      <TabsContainer>
        <TabsList>
          <Tab
            $isActive={abaAtiva === "grupos"}
            onClick={() => setAbaAtiva("grupos")}
          >
            Fase de Grupos
          </Tab>
          <Tab
            $isActive={abaAtiva === "eliminatoria"}
            onClick={() => setAbaAtiva("eliminatoria")}
          >
            Eliminatória
          </Tab>
        </TabsList>
      </TabsContainer>

      <PainelEmpatesPendentes
        etapaId={etapaId}
        atualizarEm={jogadores}
        onResolvido={carregarChaves}
        desabilitado={etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

      {abaAtiva === "grupos" ? (
        <>
          <Header>
            <Title>Grupos Rei da Praia</Title>
            <Stats>
              {grupos.length} grupos • {jogadores.length} jogadores •{" "}
              {totalPartidas} partidas
            </Stats>
          </Header>

          <GruposGrid>
            {grupos.map((grupo) => {
              const linhas = linhasDeJogadores(
                jogadores.filter((j) => j.grupoId === grupo.id)
              );

              return (
                <GrupoPainel
                  key={grupo.id}
                  formato={FormatoEtapa.REI_DA_PRAIA}
                  nome={grupo.nome}
                  etiquetas={[`${linhas.length} jogadores`]}
                  progresso={`${grupo.partidasFinalizadas || 0} / 3 partidas`}
                  completo={grupo.completo}
                  acao={
                    <Button
                      fullWidth
                      onClick={() =>
                        handleAbrirModalResultados(grupo.id, grupo.nome)
                      }
                    >
                      Registrar Resultados
                    </Button>
                  }
                >
                  {linhas.length === 0 ? (
                    <EmptyState titulo="Nenhum jogador neste grupo" />
                  ) : (
                    <TabelaClassificacao
                      formato={FormatoEtapa.REI_DA_PRAIA}
                      legenda={`Classificação do ${grupo.nome}`}
                      rotuloNome="Jogador"
                      colunas={COLUNAS_ADMIN}
                      linhas={linhas}
                      mostrarEstatisticas={temJogos(linhas)}
                    />
                  )}
                </GrupoPainel>
              );
            })}
          </GruposGrid>

          <InfoCard>
            <h4>Formato Rei da Praia</h4>
            <p>
              Cada grupo tem 4 jogadores que formam duplas diferentes em cada
              partida. São 3 partidas por grupo, garantindo que cada jogador
              jogue com todos os outros.
            </p>
            <p>
              Classificação por pontos, depois saldo de games e por fim sorteio
            </p>
          </InfoCard>
        </>
      ) : (
        <FaseEliminatoriaReiDaPraia
          etapaId={etapaId}
          arenaId={arenaId || ""}
          grupos={grupos}
          etapaTipoChaveamento={tipoChaveamento}
          melhorDe3={melhorDe3Eliminatoria}
          onEmpatePendente={carregarChaves}
          bloqueadoPorEmpate={temEmpatePendente}
        />
      )}

      {/* Modal de lançamento em lote */}
      {grupoModalAberto && (
        <ModalLancamentoResultadosLoteReiDaPraia
          partidas={partidasModal}
          grupoNome={grupoModalAberto.nome}
          etapaFinalizada={etapaFinalizada}
          melhorDe3={melhorDe3}
          onClose={() => setGrupoModalAberto(null)}
          onSuccess={handleResultadosSalvos}
        />
      )}

      {/* Loading Overlay Global - Bloqueia toda a tela */}
      <LoadingOverlay
        isLoading={globalLoading}
        message={globalLoadingMessage}
      />
    </Container>
  );
};

export default ChavesReiDaPraia;
