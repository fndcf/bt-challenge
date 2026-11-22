/**
 * Tela da eliminatória, igual na Dupla Fixa e no Rei da Praia.
 * Cada formato traz o seu hook com os dados e as ações.
 */

import React, { useState } from "react";
import styled from "styled-components";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { AcoesChaves, CabecalhoChaves } from "@/components/torneio";
import { Alert, Button, LoadingOverlay, Select } from "@/components/ui";
import { theme } from "@/styles/theme";
import { ConfrontoEliminatorio, TipoFase } from "@/types/chave";
import { FormatoEtapa } from "@/types/etapa";
import { ModalRegistrarResultadoEliminatorio } from "../../ModalRegistrarResultadoEliminatorio";
import { Conteudo } from "../styles";
import { agruparPorFase, getNomeFase } from "../utils/faseHelpers";
import { EmptyState } from "./EmptyState";
import {
  ConfrontoDaLista,
  ListaConfrontosEliminatorios,
} from "./ListaConfrontosEliminatorios";

type ConfrontoDaTela = ConfrontoDaLista & { fase: TipoFase };

/** O que os hooks da eliminatória devolvem */
export interface EliminatoriaDados<T> {
  confrontos: T[];
  loading: boolean;
  erro: string | null;
  confrontoSelecionado: T | null;
  faseAtual: TipoFase | "todas";
  etapaFinalizada: boolean;
  globalLoading: boolean;
  globalLoadingMessage: string;
  todosGruposCompletos: boolean;
  isGrupoUnico: boolean;
  partidasPendentes: number;
  finalFinalizada: boolean;
  grupoUnicoCompleto: boolean;
  setConfrontoSelecionado: (confronto: T | null) => void;
  setFaseAtual: (fase: TipoFase | "todas") => void;
  carregarConfrontos: () => Promise<void>;
  gerarEliminatoria: () => Promise<void>;
  cancelarEliminatoria: () => Promise<void>;
  encerrarEtapa: () => Promise<void>;
}

interface EliminatoriaTelaProps<T extends ConfrontoDaTela> {
  dados: EliminatoriaDados<T>;
  formato: FormatoEtapa;
  titulo: string;
  resumo: string;
  tituloFinalizada: string;
  /** Informação extra do formato, abaixo do cabeçalho */
  detalhe?: React.ReactNode;
  melhorDe3: boolean;
  bloqueadoPorEmpate: boolean;
}

const Controles = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
`;

const Filtro = styled.div`
  flex: 1 1 14rem;
  max-width: 20rem;
`;

const Detalhe = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.semantic.texto.secundario};
`;

export const EliminatoriaTela = <T extends ConfrontoDaTela>({
  dados,
  formato,
  titulo,
  resumo,
  tituloFinalizada,
  detalhe,
  melhorDe3,
  bloqueadoPorEmpate,
}: EliminatoriaTelaProps<T>) => {
  const [confirmacao, setConfirmacao] = useState<
    "cancelarEliminatoria" | "encerrarEtapa" | null
  >(null);

  const { loading, erro, etapaFinalizada, faseAtual } = dados;
  const confrontos = dados.confrontos ?? [];

  if (loading && confrontos.length === 0) {
    return <LoadingSpinner message="Carregando eliminatória..." />;
  }

  if (erro) {
    return (
      <Conteudo>
        <Alert variant="error">{erro}</Alert>
        <div>
          <Button onClick={dados.carregarConfrontos}>Tentar Novamente</Button>
        </div>
      </Conteudo>
    );
  }

  const overlay = (
    <LoadingOverlay
      isLoading={dados.globalLoading}
      message={dados.globalLoadingMessage}
    />
  );

  if (confrontos.length === 0) {
    return (
      <>
        <EmptyState
          isGrupoUnico={dados.isGrupoUnico}
          grupoUnicoCompleto={dados.grupoUnicoCompleto}
          etapaFinalizada={etapaFinalizada}
          todosGruposCompletos={dados.todosGruposCompletos}
          partidasPendentes={dados.partidasPendentes}
          loading={loading}
          onGerarEliminatoria={dados.gerarEliminatoria}
          onEncerrarEtapa={dados.encerrarEtapa}
          bloqueadoPorEmpate={bloqueadoPorEmpate}
        />
        {overlay}
      </>
    );
  }

  const fases = Object.entries(agruparPorFase(confrontos)).filter(
    ([, daFase]) => daFase.length > 0
  );
  const fasesVisiveis =
    faseAtual === "todas"
      ? fases
      : fases.filter(([fase]) => fase === faseAtual);

  const confirmar = async () => {
    if (confirmacao === "cancelarEliminatoria") {
      await dados.cancelarEliminatoria();
    } else {
      await dados.encerrarEtapa();
    }
    setConfirmacao(null);
  };

  return (
    <Conteudo>
      <CabecalhoChaves titulo={titulo} formato={formato} resumo={resumo} />

      {detalhe && <Detalhe>{detalhe}</Detalhe>}

      <Controles>
        <Filtro>
          <Select
            aria-label="Fase"
            fullWidth
            value={faseAtual}
            onChange={(e) =>
              dados.setFaseAtual(e.target.value as TipoFase | "todas")
            }
            options={[
              { value: "todas", label: "Todas as Fases" },
              ...fases.map(([fase]) => ({
                value: fase,
                label: getNomeFase(fase as TipoFase),
              })),
            ]}
          />
        </Filtro>
        <AcoesChaves>
          <Button
            variant="danger"
            onClick={() => setConfirmacao("cancelarEliminatoria")}
            disabled={loading || etapaFinalizada}
          >
            Cancelar Eliminatória
          </Button>
          {dados.finalFinalizada && (
            <Button
              onClick={() => setConfirmacao("encerrarEtapa")}
              disabled={loading || etapaFinalizada}
            >
              {etapaFinalizada ? "Etapa Encerrada" : "Encerrar Etapa"}
            </Button>
          )}
        </AcoesChaves>
      </Controles>

      {etapaFinalizada && (
        <Alert variant="success" title={tituloFinalizada}>
          Esta etapa já foi encerrada. O campeão foi definido e os pontos foram
          atribuídos.
        </Alert>
      )}

      <ListaConfrontosEliminatorios
        fases={fasesVisiveis}
        onSelecionar={dados.setConfrontoSelecionado}
        etapaFinalizada={etapaFinalizada}
      />

      {dados.confrontoSelecionado && (
        <ModalRegistrarResultadoEliminatorio
          confronto={
            dados.confrontoSelecionado as unknown as ConfrontoEliminatorio
          }
          melhorDe3={melhorDe3}
          onClose={() => dados.setConfrontoSelecionado(null)}
          onSuccess={() => {
            dados.setConfrontoSelecionado(null);
            dados.carregarConfrontos();
          }}
        />
      )}

      {confirmacao && (
        <ConfirmacaoAcao
          acao={confirmacao}
          isOpen
          onConfirm={confirmar}
          onClose={() => setConfirmacao(null)}
        />
      )}

      {overlay}
    </Conteudo>
  );
};
