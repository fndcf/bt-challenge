/**
 * Aviso de empates pendentes nos grupos (todos os formatos)
 *
 * Quando participantes empatam em todos os critérios em um grupo encerrado,
 * o backend registra o empate e bloqueia eliminatória/encerramento até o admin
 * decidir. Este painel lista os empates (com botão "Resolver") e abre o modal
 * automaticamente só quando um empate novo surge durante o uso — ex: ao salvar
 * o último resultado do grupo. Ao abrir/recarregar a página, o aviso basta.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getEtapaService } from "@/services";
import { Button } from "@/components/ui";
import { EmpatePendente } from "@/types/etapa";
import { ModalResolverEmpate } from "./ModalResolverEmpate";

interface PainelEmpatesPendentesProps {
  etapaId: string;
  // Muda sempre que a classificação é recarregada (ex: lista de grupos/equipes)
  atualizarEm?: unknown;
  onResolvido: () => void | Promise<void>;
  // Etapa finalizada: nada a resolver
  desabilitado?: boolean;
  // Avisa o pai para bloquear ações (gerar eliminatória, encerrar etapa)
  onEmpatesChange?: (empates: EmpatePendente[]) => void;
}

// ============== STYLES ==============

const Aviso = styled.div`
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-left: 4px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
`;

const AvisoTitulo = styled.h4`
  margin: 0 0 0.25rem 0;
  color: #92400e;
  font-size: 0.9375rem;
  font-weight: 700;
`;

const AvisoTexto = styled.p`
  margin: 0 0 0.75rem 0;
  color: #92400e;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ListaEmpates = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemEmpate = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: #374151;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;


// ============== HELPERS ==============

const chaveEmpate = (empate: EmpatePendente) =>
  `${empate.grupoId}:${empate.posicaoInicial}:${empate.participantes
    .map((p) => p.id)
    .sort()
    .join(",")}`;

// Empates já vistos, por etapa. Fica fora do componente porque as telas de
// chaves desmontam o conteúdo ao recarregar (spinner) e o painel remonta;
// assim só empates realmente novos abrem o modal sozinhos.
const empatesJaVistos = new Map<string, Set<string>>();

// ============== COMPONENTE ==============

export const PainelEmpatesPendentes: React.FC<PainelEmpatesPendentesProps> = ({
  etapaId,
  atualizarEm,
  onResolvido,
  desabilitado = false,
  onEmpatesChange,
}) => {
  const etapaService = getEtapaService();
  const [empates, setEmpates] = useState<EmpatePendente[]>([]);
  const [empateAberto, setEmpateAberto] = useState<EmpatePendente | null>(null);

  // Ref para não recarregar a cada render quando o pai passa callback inline
  const onEmpatesChangeRef = useRef(onEmpatesChange);
  onEmpatesChangeRef.current = onEmpatesChange;

  const atualizarLista = (lista: EmpatePendente[]) => {
    setEmpates(lista);
    onEmpatesChangeRef.current?.(lista);
  };

  const carregar = useCallback(async () => {
    if (desabilitado) {
      atualizarLista([]);
      return;
    }

    try {
      const lista = await etapaService.listarEmpatesPendentes(etapaId);
      atualizarLista(lista);

      // Primeira carga da etapa nesta página: só o aviso, sem abrir o modal
      const primeiraCarga = !empatesJaVistos.has(etapaId);
      if (primeiraCarga) {
        empatesJaVistos.set(etapaId, new Set());
      }
      const vistos = empatesJaVistos.get(etapaId)!;

      const novos = lista.filter((e) => !vistos.has(chaveEmpate(e)));
      novos.forEach((e) => vistos.add(chaveEmpate(e)));

      if (!primeiraCarga && novos.length > 0) {
        setEmpateAberto((atual) => atual ?? novos[0]);
      }
    } catch {
      // Falha ao buscar empates não deve quebrar a tela de chaves
      atualizarLista([]);
    }
  }, [etapaId, desabilitado]);

  useEffect(() => {
    carregar();
  }, [carregar, atualizarEm]);

  const handleResolvido = async () => {
    setEmpateAberto(null);
    await onResolvido();
  };

  if (empates.length === 0 && !empateAberto) {
    return null;
  }

  return (
    <>
      {empates.length > 0 && (
        <Aviso role="status">
          <AvisoTitulo>
            {empates.length === 1
              ? "Empate na classificação"
              : `${empates.length} empates na classificação`}
          </AvisoTitulo>
          <AvisoTexto>
            Os participantes abaixo empataram em todos os critérios. Defina a
            ordem por sorteio ou manualmente para liberar a próxima fase.
          </AvisoTexto>
          <ListaEmpates>
            {empates.map((empate) => (
              <ItemEmpate key={chaveEmpate(empate)}>
                <span>
                  <strong>{empate.grupoNome}</strong> —{" "}
                  {empate.participantes.map((p) => p.nome).join(" × ")} (a
                  partir do {empate.posicaoInicial}º lugar)
                </span>
                <Button
                  type="button"
                  onClick={() => setEmpateAberto(empate)}
                  style={{ flexShrink: 0 }}
                >
                  Resolver
                </Button>
              </ItemEmpate>
            ))}
          </ListaEmpates>
        </Aviso>
      )}

      {empateAberto && (
        <ModalResolverEmpate
          etapaId={etapaId}
          empate={empateAberto}
          onClose={() => setEmpateAberto(null)}
          onResolvido={handleResolvido}
        />
      )}
    </>
  );
};

export default PainelEmpatesPendentes;
