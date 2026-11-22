import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getChaveService, getEtapaService } from "@/services";
import { Dupla, Grupo, Partida } from "@/types/chave";
import { FaseEliminatoria } from "../FaseEliminatoria";
import { LoadingOverlay, Button, EmptyState } from "@/components/ui";
import { ModalLancamentoResultadosLoteDuplaFixa } from "../ModalLancamentoResultadosLoteDuplaFixa";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";
import { GrupoPainel, GruposGrid, TabelaClassificacao } from "@/components/torneio";
import { FormatoEtapa } from "@/types/etapa";
import { COLUNAS_ADMIN, linhasDeDuplas, temJogos } from "@/utils/classificacao";

interface ChavesEtapaProps {
  etapaId: string;
  arenaId?: string;
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
    ${(props) => (props.$isActive ? "#2563eb" : "transparent")};
  color: ${(props) => (props.$isActive ? "#2563eb" : "#6b7280")};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: #2563eb;
  }

  /* MOBILE: Botões verticais */
  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    background: ${(props) => (props.$isActive ? "#eff6ff" : "white")};
    border-color: ${(props) => (props.$isActive ? "#2563eb" : "#e5e7eb")};
    border-bottom: 1px solid
      ${(props) => (props.$isActive ? "#2563eb" : "#e5e7eb")};

    &:hover {
      background: ${(props) => (props.$isActive ? "#eff6ff" : "#f9fafb")};
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
`;

// ============== COMPONENTE ==============

export const ChavesEtapa: React.FC<ChavesEtapaProps> = ({
  etapaId,
  arenaId,
  etapaFinalizada = false,
  melhorDe3 = false,
  melhorDe3Eliminatoria = false,
}) => {
  const chaveService = getChaveService();
  const etapaService = getEtapaService();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [duplas, setDuplas] = useState<Dupla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_eliminatoriaExiste, setEliminatoriaExiste] = useState(false);
  const [_etapaFinalizada, setEtapaFinalizada] = useState(false);
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
  const [partidasModal, setPartidasModal] = useState<Partida[]>([]);

  useEffect(() => {
    carregarChaves();
  }, [etapaId, abaAtiva]);

  const carregarChaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gruposData, duplasData] = await Promise.all([
        chaveService.buscarGrupos(etapaId),
        chaveService.buscarDuplas(etapaId),
      ]);

      setGrupos(gruposData);
      setDuplas(duplasData);

      try {
        const etapa = await etapaService.buscarPorId(etapaId);
        if (etapa) {
          setEtapaFinalizada(etapa.status === "finalizada");
        }
      } catch {
        // Não crítico: sem o status, a tela segue como etapa não finalizada
      }

      try {
        const confrontos = await chaveService.buscarConfrontosEliminatorios(
          etapaId
        );
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

      const todasPartidas = await chaveService.buscarPartidas(etapaId);
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
        atualizarEm={duplas}
        onResolvido={carregarChaves}
        desabilitado={etapaFinalizada || _etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

      {abaAtiva === "grupos" ? (
        <>
          <Header>
            <Title>Grupos e Duplas</Title>
            <Stats>
              {grupos.length} grupos • {duplas.length} duplas
            </Stats>
          </Header>

          <GruposGrid>
            {grupos.map((grupo) => {
              const linhas = linhasDeDuplas(
                duplas.filter((d) => d.grupoId === grupo.id)
              );

              return (
                <GrupoPainel
                  key={grupo.id}
                  formato={FormatoEtapa.DUPLA_FIXA}
                  nome={grupo.nome}
                  etiquetas={[`${linhas.length} duplas`]}
                  progresso={`${grupo.partidasFinalizadas} / ${grupo.totalPartidas} partidas`}
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
                    <EmptyState titulo="Nenhuma dupla neste grupo" />
                  ) : (
                    <TabelaClassificacao
                      formato={FormatoEtapa.DUPLA_FIXA}
                      legenda={`Classificação do ${grupo.nome}`}
                      rotuloNome="Dupla"
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
            <h4> Fase de Grupos</h4>
            <p>
              Cada dupla joga contra todas as outras duplas do seu grupo. As
              duplas com melhor campanha classificam para a próxima fase.
            </p>
          </InfoCard>
        </>
      ) : (
        <FaseEliminatoria
          etapaId={etapaId}
          arenaId={arenaId || ""}
          grupos={grupos}
          melhorDe3={melhorDe3Eliminatoria}
          bloqueadoPorEmpate={temEmpatePendente}
        />
      )}

      {/* Modal de lançamento em lote */}
      {grupoModalAberto && (
        <ModalLancamentoResultadosLoteDuplaFixa
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

export default ChavesEtapa;
