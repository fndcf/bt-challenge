/**
 * Eliminatória ainda não gerada (Dupla Fixa e Rei da Praia)
 */

import React from "react";
import { Alert, Button } from "@/components/ui";
import { Dica, EstadoInicial, EstadoTitulo } from "../styles";

interface EmptyStateProps {
  isGrupoUnico: boolean;
  grupoUnicoCompleto: boolean;
  etapaFinalizada: boolean;
  todosGruposCompletos: boolean;
  partidasPendentes: number;
  loading: boolean;
  onGerarEliminatoria: () => void;
  onEncerrarEtapa: () => void;
  // Empate pendente nos grupos: gerar/encerrar ficam bloqueados até resolver
  bloqueadoPorEmpate?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isGrupoUnico,
  grupoUnicoCompleto,
  etapaFinalizada,
  todosGruposCompletos,
  partidasPendentes,
  loading,
  onGerarEliminatoria,
  onEncerrarEtapa,
  bloqueadoPorEmpate = false,
}) => {
  const avisoEmpate = bloqueadoPorEmpate && (
    <Dica>Resolva o empate indicado acima para liberar esta ação.</Dica>
  );

  const renderGrupoUnico = () => {
    if (!grupoUnicoCompleto) {
      return (
        <Alert
          variant="warning"
          title="Finalize todas as partidas do grupo primeiro"
        >
          Ainda há {partidasPendentes} partida(s) pendente(s). Complete todos os
          jogos para definir o campeão.
        </Alert>
      );
    }

    if (etapaFinalizada) {
      return (
        <Alert variant="success" title="Etapa Finalizada!">
          Esta etapa já foi encerrada. O campeão foi definido e os pontos foram
          atribuídos.
        </Alert>
      );
    }

    return (
      <>
        <Alert variant="warning" title="Grupo Completo!">
          <p>Todas as partidas foram finalizadas. O campeão está definido!</p>
          <p>
            <strong>Próximo passo:</strong> Encerre a etapa para atribuir pontos
            ao ranking.
          </p>
        </Alert>
        <Button
          onClick={onEncerrarEtapa}
          disabled={loading || bloqueadoPorEmpate}
        >
          Encerrar Etapa e Atribuir Pontos
        </Button>
        {avisoEmpate}
      </>
    );
  };

  return (
    <EstadoInicial>
      <EstadoTitulo>Fase Eliminatória</EstadoTitulo>

      {isGrupoUnico ? (
        <>
          <Alert title="Grupo Único - Sistema Round-Robin">
            <p>
              Com apenas 1 grupo, todos os jogadores já se enfrentaram no
              sistema <strong>Todos contra Todos</strong>.
            </p>
            <p>
              O <strong>1º colocado</strong> do grupo é automaticamente o{" "}
              <strong>CAMPEÃO</strong>!
            </p>
          </Alert>
          {renderGrupoUnico()}
          <Dica>
            Para ter fase eliminatória, configure a etapa com 2 ou mais grupos
          </Dica>
        </>
      ) : !todosGruposCompletos ? (
        <>
          <Alert
            variant="warning"
            title="Finalize todas as partidas da fase de grupos primeiro"
          >
            Ainda há {partidasPendentes} partida(s) pendente(s) nos grupos.
            Complete todos os jogos para gerar a fase eliminatória.
          </Alert>
          <Button disabled>Gerar Fase Eliminatória</Button>
        </>
      ) : (
        <>
          <p>
            A fase de grupos foi concluída! Gere a fase eliminatória para
            continuar o torneio.
          </p>
          <Button
            onClick={onGerarEliminatoria}
            disabled={loading || bloqueadoPorEmpate}
          >
            Gerar Fase Eliminatória
          </Button>
          {avisoEmpate}
        </>
      )}
    </EstadoInicial>
  );
};
