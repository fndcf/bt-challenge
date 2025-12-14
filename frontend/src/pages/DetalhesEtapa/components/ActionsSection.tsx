/**
 * Responsabilidade única: Renderizar seção de ações administrativas
 */

import React from "react";
import { Etapa, StatusEtapa } from "@/types/etapa";
import * as S from "../DetalhesEtapa.styles";

interface ActionsSectionProps {
  etapa: Etapa;
  isReiDaPraia: boolean;
  isSuperX?: boolean;
  isTeams?: boolean;
  todasPartidasFinalizadas?: boolean;
  onAbrirInscricoes: () => Promise<void>;
  onEncerrarInscricoes: () => Promise<void>;
  onGerarChaves: () => Promise<void>;
  onApagarChaves: () => void;
  onFinalizarEtapa: () => Promise<void>;
  onVerChaves: () => void;
}

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  etapa,
  isReiDaPraia,
  isSuperX = false,
  isTeams = false,
  todasPartidasFinalizadas = false,
  onAbrirInscricoes,
  onEncerrarInscricoes,
  onGerarChaves,
  onApagarChaves,
  onFinalizarEtapa,
  onVerChaves,
}) => {
  const inscricoesAbertas = etapa.status === StatusEtapa.INSCRICOES_ABERTAS;
  const inscricoesEncerradas =
    etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS;

  // Validação simples: inscritos completos quando totalInscritos === maxJogadores
  const inscritosCompletos = etapa.totalInscritos === etapa.maxJogadores;
  const faltam = (etapa.maxJogadores || 0) - etapa.totalInscritos;
  const mensagemIncompleto = `Faltam ${faltam} jogador${faltam !== 1 ? "es" : ""} (${etapa.totalInscritos}/${etapa.maxJogadores})`;

  const mostrarBotaoGerarChaves = inscricoesEncerradas && !etapa.chavesGeradas;
  const podeGerarChaves = mostrarBotaoGerarChaves && inscritosCompletos;
  const podeEncerrar = inscricoesAbertas && etapa.totalInscritos >= 4;

  return (
    <S.ActionsSection>
      <S.CardTitle>Ações Administrativas</S.CardTitle>

      <S.ActionsGrid>
        {/* Abrir inscrições */}
        {etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS &&
          !etapa.chavesGeradas && (
            <S.Button
              $variant="green"
              onClick={onAbrirInscricoes}
            >
              <span>Reabrir Inscrições</span>
            </S.Button>
          )}

        {/* Encerrar inscrições */}
        {podeEncerrar && (
          <S.Button
            $variant="orange"
            onClick={onEncerrarInscricoes}
          >
            <span>Encerrar Inscrições</span>
          </S.Button>
        )}

        {/* Gerar chaves/equipes */}
        {mostrarBotaoGerarChaves && (
          <S.Button
            $variant="blue"
            onClick={onGerarChaves}
            disabled={!podeGerarChaves}
            title={!podeGerarChaves ? mensagemIncompleto : ""}
          >
            <span>{isTeams ? "Gerar Equipes" : "Gerar Chaves"}</span>
          </S.Button>
        )}

        {/* Ver chaves/equipes */}
        {etapa.chavesGeradas && (
          <S.Button $variant="blue" onClick={onVerChaves}>
            <span>{isTeams ? "Ver Equipes" : "Ver Chaves"}</span>
          </S.Button>
        )}

        {/* Apagar chaves/equipes */}
        {etapa.chavesGeradas && (
          <S.Button $variant="red" onClick={onApagarChaves}>
            <span>{isTeams ? "Apagar Equipes" : "Apagar Chaves"}</span>
          </S.Button>
        )}

        {/* Finalizar etapa - para Super X e TEAMS, após todas as partidas/confrontos serem finalizados */}
        {etapa.chavesGeradas &&
          (isSuperX || isTeams) &&
          (etapa.status === StatusEtapa.EM_ANDAMENTO ||
            etapa.status === StatusEtapa.CHAVES_GERADAS) &&
          todasPartidasFinalizadas && (
            <S.Button
              $variant="green"
              onClick={onFinalizarEtapa}
            >
              <span>Finalizar Etapa</span>
            </S.Button>
          )}
      </S.ActionsGrid>

      {/* Alertas */}
      {inscricoesAbertas && isReiDaPraia && etapa.totalInscritos < 8 && (
        <S.Alert $variant="purple">
          <p>
            <strong>Rei da Praia:</strong> Você precisa de pelo menos 8
            jogadores inscritos (múltiplo de 4) para encerrar as inscrições.
          </p>
        </S.Alert>
      )}

      {inscricoesAbertas &&
        isReiDaPraia &&
        etapa.totalInscritos >= 8 &&
        etapa.totalInscritos % 4 !== 0 && (
          <S.Alert $variant="purple">
            <p>
              <strong>Rei da Praia:</strong> Você tem {etapa.totalInscritos}{" "}
              jogadores. O número deve ser múltiplo de 4 para formar grupos
              completos.
            </p>
            <p>
              Próximos valores válidos:{" "}
              {Math.floor(etapa.totalInscritos / 4) * 4} ou{" "}
              {Math.ceil(etapa.totalInscritos / 4) * 4}
            </p>
          </S.Alert>
        )}

      {inscricoesAbertas && isSuperX && etapa.totalInscritos < etapa.maxJogadores && (
        <S.Alert $variant="purple">
          <p>
            <strong>Super {etapa.varianteSuperX}:</strong> Você precisa de exatamente{" "}
            {etapa.maxJogadores} jogadores inscritos para encerrar as inscrições.
            Atualmente: {etapa.totalInscritos}/{etapa.maxJogadores}
          </p>
        </S.Alert>
      )}

      {inscricoesAbertas && isTeams && (
        <S.Alert $variant="purple">
          <p>
            <strong>TEAMS {etapa.varianteTeams}:</strong> O numero de jogadores deve ser multiplo de{" "}
            {etapa.varianteTeams || 4} para formar equipes completas.
            Atualmente: {etapa.totalInscritos} jogadores
          </p>
          {etapa.totalInscritos > 0 && etapa.totalInscritos % (etapa.varianteTeams || 4) !== 0 && (
            <p>
              Proximos valores validos:{" "}
              {Math.floor(etapa.totalInscritos / (etapa.varianteTeams || 4)) * (etapa.varianteTeams || 4)} ou{" "}
              {Math.ceil(etapa.totalInscritos / (etapa.varianteTeams || 4)) * (etapa.varianteTeams || 4)}
            </p>
          )}
        </S.Alert>
      )}

      {inscricoesAbertas && !isReiDaPraia && !isSuperX && !isTeams && etapa.totalInscritos < 4 && (
        <S.Alert $variant="blue">
          <p>
            Você precisa de pelo menos 4 jogadores inscritos (número par) para
            encerrar as inscrições.
          </p>
        </S.Alert>
      )}

      {etapa.totalInscritos > 0 && !etapa.chavesGeradas && (
        <S.Alert $variant="orange">
          <p>
            <strong>Atenção:</strong> Para excluir esta etapa, você precisa
            cancelar todas as {etapa.totalInscritos} inscrição(ões) primeiro.
          </p>
        </S.Alert>
      )}

      {etapa.chavesGeradas && (
        <S.Alert $variant="red">
          <p>
            <strong>Bloqueado:</strong> Não é possível excluir etapa após
            geração de chaves.
          </p>
        </S.Alert>
      )}

      {/* Alerta: inscrições incompletas para gerar chaves */}
      {mostrarBotaoGerarChaves && !inscritosCompletos && (
        <S.Alert $variant="yellow">
          <p>
            <strong>Inscrições incompletas:</strong> {mensagemIncompleto}
          </p>
        </S.Alert>
      )}

      {/* Alerta: finalizar todas as partidas antes de encerrar - para Super X e TEAMS */}
      {etapa.chavesGeradas &&
        (isSuperX || isTeams) &&
        !todasPartidasFinalizadas &&
        etapa.status !== StatusEtapa.FINALIZADA && (
          <S.Alert $variant="blue">
            <p>
              <strong>Aguardando resultados:</strong> Para finalizar a etapa,
              registre o resultado de {isTeams ? "todos os confrontos" : "todas as partidas"} primeiro.
            </p>
          </S.Alert>
        )}
    </S.ActionsSection>
  );
};

export default ActionsSection;
