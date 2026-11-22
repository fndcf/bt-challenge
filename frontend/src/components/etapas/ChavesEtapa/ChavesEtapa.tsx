import React, { useState, useEffect } from "react";
import { getChaveService, getEtapaService } from "@/services";
import { Dupla, Grupo, Partida } from "@/types/chave";
import { FaseEliminatoria } from "../FaseEliminatoria";
import { Alert, Button, EmptyState, LoadingOverlay, Tabs } from "@/components/ui";
import { ModalLancamentoResultadosLoteDuplaFixa } from "../ModalLancamentoResultadosLoteDuplaFixa";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";
import {
  CabecalhoChaves,
  EstadoChaves,
  GrupoPainel,
  GruposGrid,
  TabelaClassificacao,
  TelaChaves,
} from "@/components/torneio";
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

const ABAS: { id: AbaAtiva; label: string }[] = [
  { id: "grupos", label: "Fase de Grupos" },
  { id: "eliminatoria", label: "Eliminatória" },
];

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

  if (loading || error || grupos.length === 0) {
    return (
      <EstadoChaves
        carregando={loading}
        erro={error}
        vazio="Nenhuma chave gerada ainda"
      />
    );
  }

  return (
    <TelaChaves>
      <Tabs
        rotulo="Fases da etapa"
        formato={FormatoEtapa.DUPLA_FIXA}
        abas={ABAS}
        ativa={abaAtiva}
        onChange={setAbaAtiva}
      />

      <PainelEmpatesPendentes
        etapaId={etapaId}
        atualizarEm={duplas}
        onResolvido={carregarChaves}
        desabilitado={etapaFinalizada || _etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

      {abaAtiva === "grupos" ? (
        <>
          <CabecalhoChaves
            titulo="Grupos e Duplas"
            formato={FormatoEtapa.DUPLA_FIXA}
            resumo={`${grupos.length} grupos • ${duplas.length} duplas`}
          />

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

          <Alert title="Fase de Grupos">
            Cada dupla joga contra todas as outras duplas do seu grupo. As
            duplas com melhor campanha classificam para a próxima fase.
          </Alert>
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
    </TelaChaves>
  );
};

export default ChavesEtapa;
