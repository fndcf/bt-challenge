/**
 * Chave eliminatória na página pública: uma coluna por fase, da final para trás
 */

import React from "react";
import styled from "styled-components";
import { CardConfronto, SecaoPublica } from "@/components/torneio";
import { BadgeTom, EmptyState } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Chaves, PartidaChave, StatusPartidaChave } from "@/types/etapaPublica";

interface BracketViewerProps {
  chaves: Chaves;
}

// ============== STYLED COMPONENTS ==============

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Rolagem = styled.div`
  overflow-x: auto;
  padding-bottom: ${theme.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 2px;
  }
`;

const Fases = styled.div`
  display: flex;
  gap: ${theme.spacing[6]};
  min-width: fit-content;
`;

const Fase = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  width: 17rem;
`;

const FaseNome = styled.h3`
  margin: 0;
  padding-bottom: ${theme.spacing[3]};
  border-bottom: 2px solid ${superficie.borda};
  text-align: center;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.bold};
  color: ${texto.secundario};
`;

const Bye = styled.div`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  border: 1px solid ${status.neutro.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${status.neutro.fundo};
  color: ${status.neutro.texto};
  text-align: center;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
`;

// ============== HELPERS ==============

const SITUACAO: Record<StatusPartidaChave, { label: string; tom: BadgeTom }> = {
  agendada: { label: "Aguardando", tom: "aviso" },
  em_andamento: { label: "Ao vivo", tom: "info" },
  finalizada: { label: "Finalizada", tom: "sucesso" },
  bye: { label: "BYE", tom: "neutro" },
};

const renderPartida = (partida: PartidaChave) => {
  if (partida.status === "bye") {
    return <Bye key={partida.id}>{`${partida.jogador1.nome} (BYE)`}</Bye>;
  }

  const finalizada = partida.status === "finalizada";
  const montarLado = (lado: 1 | 2) => {
    const jogador = lado === 1 ? partida.jogador1 : partida.jogador2;
    const campo = lado === 1 ? "gamesDupla1" : "gamesDupla2";

    return {
      nome: jogador?.nome || "A definir",
      placar:
        finalizada && partida.placarDetalhado?.length
          ? partida.placarDetalhado.map((set) => set[campo]).join(", ")
          : undefined,
      vencedor: partida.vencedor === `jogador${lado}`,
    };
  };

  return (
    <CardConfronto
      key={partida.id}
      compacto
      situacao={SITUACAO[partida.status]}
      lado1={montarLado(1)}
      lado2={montarLado(2)}
    />
  );
};

// ============== COMPONENT ==============

const BracketViewer: React.FC<BracketViewerProps> = ({ chaves }) => {
  if (!chaves?.temChaves || !chaves.rodadas?.length) {
    return (
      <SecaoPublica titulo="Chaveamento">
        <EmptyState
          titulo="Chaves ainda não geradas"
          descricao="Aguarde a conclusão da fase de grupos"
        />
      </SecaoPublica>
    );
  }

  // Final → Semifinal → Quartas → Oitavas
  const rodadas = [...chaves.rodadas].sort((a, b) => b.numero - a.numero);

  return (
    <SecaoPublica
      titulo="Chaveamento Eliminatório"
      descricao="Deslize para ver todas as fases"
    >
      {/* tabIndex: permite rolar pelo teclado */}
      <Rolagem role="region" aria-label="Fases da eliminatória" tabIndex={0}>
        <Fases>
          {rodadas.map((rodada) => (
            <Fase key={`${rodada.numero}-${rodada.nome}`}>
              <FaseNome>{rodada.nome}</FaseNome>
              {rodada.partidas.map(renderPartida)}
            </Fase>
          ))}
        </Fases>
      </Rolagem>
    </SecaoPublica>
  );
};

export default BracketViewer;
