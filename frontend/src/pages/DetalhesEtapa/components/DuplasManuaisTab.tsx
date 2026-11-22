/**
 * Tab para formação manual de duplas no formato DUPLA FIXA
 */

import React, { useMemo, useState } from "react";
import {
  CartaoFormacao,
  GradeFormacao,
  JogadoresDisponiveis,
} from "@/components/etapas/FormacaoManual";
import { AcoesChaves } from "@/components/torneio";
import { Alert, Button } from "@/components/ui";
import { FormatoEtapa, Inscricao } from "@/types/etapa";
import { Cartao } from "@/components/layout/Pagina";
import { getMensagemErro } from "@/utils/erro";

interface DuplasManuaisTabProps {
  inscricoes: Inscricao[];
  isMisto?: boolean;
  onConfirm: (
    formacoes: { jogador1Id: string; jogador2Id: string }[]
  ) => Promise<void>;
}

const JOGADORES_POR_DUPLA = 2;

export const DuplasManuaisTab: React.FC<DuplasManuaisTabProps> = ({
  inscricoes,
  isMisto = false,
  onConfirm,
}) => {
  const confirmadas = useMemo(
    () => inscricoes.filter((i) => i.status === "confirmada"),
    [inscricoes]
  );
  const porJogador = useMemo(
    () => new Map(confirmadas.map((i) => [i.jogadorId, i])),
    [confirmadas]
  );
  const numDuplas = Math.floor(confirmadas.length / JOGADORES_POR_DUPLA);

  // Cada dupla é a lista de ids dos seus jogadores
  const duplasVazias = (): string[][] =>
    Array.from({ length: numDuplas }, () => []);
  const [duplas, setDuplas] = useState<string[][]>(duplasVazias);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alocados = new Set(duplas.flat());
  const disponiveis = confirmadas.filter((i) => !alocados.has(i.jogadorId));
  const primeiraIncompleta = duplas.findIndex(
    (dupla) => dupla.length < JOGADORES_POR_DUPLA
  );
  const todasCompletas = primeiraIncompleta === -1;

  const alterarDupla = (
    indice: number,
    alterar: (dupla: string[]) => string[]
  ) => setDuplas((prev) => prev.map((d, i) => (i === indice ? alterar(d) : d)));

  const adicionarJogador = (jogadorId: string) => {
    alterarDupla(primeiraIncompleta, (dupla) => [...dupla, jogadorId]);
    setError(null);
  };

  const limparTudo = () => {
    setDuplas(duplasVazias());
    setError(null);
  };

  const handleConfirm = async () => {
    if (isMisto) {
      const invalida = duplas.findIndex(
        ([id1, id2]) =>
          porJogador.get(id1)?.jogadorGenero ===
          porJogador.get(id2)?.jogadorGenero
      );
      if (invalida !== -1) {
        setError(
          `Dupla ${
            invalida + 1
          }: etapa mista requer 1 masculino + 1 feminino por dupla`
        );
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      await onConfirm(
        duplas.map(([jogador1Id, jogador2Id]) => ({ jogador1Id, jogador2Id }))
      );
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao formar duplas"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Cartao>
      <Alert title={`Formação Manual - ${numDuplas} duplas de 2 jogadores`}>
        Clique nos jogadores disponíveis para adicioná-los a uma dupla.
        {isMisto && " Cada dupla deve ter 1 jogador masculino e 1 feminino."}
      </Alert>

      {error && (
        <div role="alert">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <GradeFormacao>
        {duplas.map((dupla, indice) => (
          <CartaoFormacao
            key={indice}
            formato={FormatoEtapa.DUPLA_FIXA}
            titulo={<span>{`Dupla ${indice + 1}`}</span>}
            jogadores={dupla.map((id) => porJogador.get(id))}
            tamanho={JOGADORES_POR_DUPLA}
            isMisto={isMisto}
            onRemover={(jogadorId) =>
              alterarDupla(indice, (atual) =>
                atual.filter((id) => id !== jogadorId)
              )
            }
          />
        ))}
      </GradeFormacao>

      <JogadoresDisponiveis
        jogadores={disponiveis}
        isMisto={isMisto}
        onEscolher={adicionarJogador}
        desabilitado={todasCompletas}
      />

      <AcoesChaves>
        <Button variant="secondary" onClick={limparTudo} disabled={loading}>
          Limpar Tudo
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!todasCompletas || loading}
          loading={loading}
        >
          {loading ? "Gerando..." : "Confirmar Duplas e Gerar Chaves"}
        </Button>
      </AcoesChaves>
    </Cartao>
  );
};

export default DuplasManuaisTab;
