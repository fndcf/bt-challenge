/**
 * ActionsSection.tsx
 *
 * Responsabilidade única: Renderizar seção de ações administrativas
 */

import React from "react";
import { Etapa, StatusEtapa } from "@/types/etapa";
import * as S from "../DetalhesEtapa.styles";

interface ActionsSectionProps {
  etapa: Etapa;
  isReiDaPraia: boolean;
  onAbrirInscricoes: () => void;
  onEncerrarInscricoes: () => void;
  onGerarChaves: () => void;
  onApagarChaves: () => void;
  onFinalizarEtapa: () => void;
  onVerChaves: () => void;
}

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  etapa,
  isReiDaPraia,
  onAbrirInscricoes,
  onEncerrarInscricoes,
  onGerarChaves,
  onApagarChaves,
  onFinalizarEtapa,
  onVerChaves,
}) => {
  const inscricoesAbertas = etapa.status === StatusEtapa.INSCRICOES_ABERTAS;
  const inscricoesEncerradas = etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS;
  const podeGerarChaves =
    inscricoesEncerradas && !etapa.chavesGeradas && etapa.totalInscritos >= 4;
  const podeEncerrar = inscricoesAbertas && etapa.totalInscritos >= 4;

  return (
    <S.ActionsSection>
      <S.CardTitle>🎮 Ações Administrativas</S.CardTitle>

      <S.ActionsGrid>
        {/* Abrir inscrições */}
        {etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS && !etapa.chavesGeradas && (
          <S.Button $variant="green" onClick={onAbrirInscricoes}>
            <span>🔓 Reabrir Inscrições</span>
          </S.Button>
        )}

        {/* Encerrar inscrições */}
        {podeEncerrar && (
          <S.Button $variant="orange" onClick={onEncerrarInscricoes}>
            <span>🔒 Encerrar Inscrições</span>
          </S.Button>
        )}

        {/* Gerar chaves */}
        {podeGerarChaves && (
          <S.Button $variant="blue" onClick={onGerarChaves}>
            <span>🎾 Gerar Chaves</span>
          </S.Button>
        )}

        {/* Ver chaves */}
        {etapa.chavesGeradas && (
          <S.Button $variant="blue" onClick={onVerChaves}>
            <span>👁️ Ver Chaves</span>
          </S.Button>
        )}

        {/* Apagar chaves */}
        {etapa.chavesGeradas && etapa.status !== StatusEtapa.FINALIZADA && (
          <S.Button $variant="red" onClick={onApagarChaves}>
            <span>🗑️ Apagar Chaves</span>
          </S.Button>
        )}

        {/* Finalizar etapa */}
        {etapa.chavesGeradas && etapa.status === StatusEtapa.EM_ANDAMENTO && (
          <S.Button $variant="green" onClick={onFinalizarEtapa}>
            <span>🏆 Finalizar Etapa</span>
          </S.Button>
        )}
      </S.ActionsGrid>

      {/* Alertas */}
      {inscricoesAbertas && isReiDaPraia && etapa.totalInscritos < 8 && (
        <S.Alert $variant="purple">
          <p>
            <strong>👑 Rei da Praia:</strong> Você precisa de pelo menos 8
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
              <strong>👑 Rei da Praia:</strong> Você tem {etapa.totalInscritos}{" "}
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

      {inscricoesAbertas && !isReiDaPraia && etapa.totalInscritos < 4 && (
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
    </S.ActionsSection>
  );
};

export default ActionsSection;
