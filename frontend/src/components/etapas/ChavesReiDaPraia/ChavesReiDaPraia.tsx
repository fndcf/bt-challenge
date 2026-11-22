import React, { useCallback, useEffect, useState } from "react";
import { getReiDaPraiaService } from "@/services";
import { Grupo } from "@/types/chave";
import {
  EstatisticasJogador,
  TipoChaveamentoReiDaPraia,
  PartidaReiDaPraia,
} from "@/types/reiDaPraia";
import { FaseEliminatoriaReiDaPraia } from "../FaseEliminatoriaReiDaPraia";
import { Alert, Button, EmptyState, LoadingOverlay, Tabs } from "@/components/ui";
import {
  CabecalhoChaves,
  EstadoChaves,
  GrupoPainel,
  GruposGrid,
  TabelaClassificacao,
  TelaChaves,
} from "@/components/torneio";
import { FormatoEtapa } from "@/types/etapa";
import {
  COLUNAS_ADMIN,
  linhasDeJogadores,
  temJogos,
} from "@/utils/classificacao";
import { ModalLancamentoResultadosLoteReiDaPraia } from "../ModalLancamentoResultadosLoteReiDaPraia";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";
import { getMensagemErro } from "@/utils/erro";

interface ChavesReiDaPraiaProps {
  etapaId: string;
  arenaId?: string;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  melhorDe3Eliminatoria?: boolean;
}

type AbaAtiva = "grupos" | "eliminatoria";

const ABAS: { id: AbaAtiva; label: string }[] = [
  { id: "grupos", label: "Fase de Grupos" },
  { id: "eliminatoria", label: "Eliminatória" },
];

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

  const carregarChaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [gruposData, jogadoresData] = await Promise.all([
        getReiDaPraiaService().buscarGrupos(etapaId),
        getReiDaPraiaService().buscarJogadores(etapaId),
      ]);

      setGrupos(gruposData);
      setJogadores(jogadoresData);

      // Verificar se existe fase eliminatória
      try {
        const confrontos =
          await getReiDaPraiaService().buscarConfrontosEliminatorios(etapaId);
        setEliminatoriaExiste(confrontos && confrontos.length > 0);
      } catch {
        setEliminatoriaExiste(false);
      }
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao carregar chaves"));
    } finally {
      setLoading(false);
    }
  }, [etapaId]);

  // Recarrega também ao trocar de aba
  useEffect(() => {
    carregarChaves();
  }, [carregarChaves, abaAtiva]);

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
    } catch (err) {
      alert(getMensagemErro(err, "Erro ao carregar partidas"));
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

  // Calcular total de partidas (3 por grupo)
  const totalPartidas = grupos.length * 3;

  return (
    <TelaChaves>
      <Tabs
        rotulo="Fases da etapa"
        formato={FormatoEtapa.REI_DA_PRAIA}
        abas={ABAS}
        ativa={abaAtiva}
        onChange={setAbaAtiva}
      />

      <PainelEmpatesPendentes
        etapaId={etapaId}
        atualizarEm={jogadores}
        onResolvido={carregarChaves}
        desabilitado={etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

      {abaAtiva === "grupos" ? (
        <>
          <CabecalhoChaves
            titulo="Grupos Rei da Praia"
            formato={FormatoEtapa.REI_DA_PRAIA}
            resumo={`${grupos.length} grupos • ${jogadores.length} jogadores • ${totalPartidas} partidas`}
          />

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

          <Alert title="Formato Rei da Praia">
            <p>
              Cada grupo tem 4 jogadores que formam duplas diferentes em cada
              partida. São 3 partidas por grupo, garantindo que cada jogador
              jogue com todos os outros.
            </p>
            <p>
              Classificação por pontos, depois saldo de games. Em caso de
              empate, o organizador sorteia ou escolhe a ordem.
            </p>
          </Alert>
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
    </TelaChaves>
  );
};

export default ChavesReiDaPraia;
