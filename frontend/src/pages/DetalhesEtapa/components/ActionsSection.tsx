/**
 * Responsabilidade única: Renderizar seção de ações administrativas
 */

import React from "react";
import { Download } from "lucide-react";
import styled from "styled-components";
import { Alert, Button } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Etapa, StatusEtapa } from "@/types/etapa";
import { Cartao, CartaoTitulo } from "@/components/layout/Pagina";

interface ActionsSectionProps {
  etapa: Etapa;
  isReiDaPraia: boolean;
  isSuperX?: boolean;
  isTeams?: boolean;
  onAbrirInscricoes: () => Promise<void>;
  onEncerrarInscricoes: () => Promise<void>;
  onGerarChaves: () => Promise<void>;
  onApagarChaves: () => void;
  onVerChaves: () => void;
  onSubstituirJogador?: () => void;
  onExportarSumula?: () => void;
  exportandoSumula?: boolean;
}

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[3]};

  @media (max-width: ${theme.breakpoints.sm}) {
    > button {
      flex: 1 1 100%;
    }
  }
`;

/** "Próximos valores válidos: 8 ou 12" quando o total não fecha múltiplos */
const proximosValidos = (total: number, multiplo: number): string | null =>
  total > 0 && total % multiplo !== 0
    ? `Próximos valores válidos: ${
        Math.floor(total / multiplo) * multiplo
      } ou ${Math.ceil(total / multiplo) * multiplo}`
    : null;

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  etapa,
  isReiDaPraia,
  isSuperX = false,
  isTeams = false,
  onAbrirInscricoes,
  onEncerrarInscricoes,
  onGerarChaves,
  onApagarChaves,
  onVerChaves,
  onSubstituirJogador,
  onExportarSumula,
  exportandoSumula = false,
}) => {
  const { totalInscritos, maxJogadores, chavesGeradas } = etapa;
  const inscricoesAbertas = etapa.status === StatusEtapa.INSCRICOES_ABERTAS;
  const podeGerar =
    etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS && !chavesGeradas;

  const inscritosCompletos = totalInscritos === maxJogadores;
  const faltam = (maxJogadores || 0) - totalInscritos;
  const mensagemIncompleto = `Faltam ${faltam} jogador${
    faltam !== 1 ? "es" : ""
  } (${totalInscritos}/${maxJogadores})`;

  const alvo = isTeams ? "Equipes" : "Chaves";

  const renderRegraInscricao = () => {
    if (!inscricoesAbertas) return null;

    if (isTeams) {
      const multiplo = etapa.varianteTeams || 4;
      const proximos = proximosValidos(totalInscritos, multiplo);
      return (
        <Alert title={`TEAMS ${etapa.varianteTeams}`}>
          <p>
            {`O número de jogadores deve ser múltiplo de ${multiplo} para formar equipes completas. Atualmente: ${totalInscritos} jogadores.`}
          </p>
          {proximos && <p>{proximos}</p>}
        </Alert>
      );
    }

    if (isSuperX) {
      if (totalInscritos >= maxJogadores) return null;
      return (
        <Alert title={`Super ${etapa.varianteSuperX}`}>
          {`Você precisa de exatamente ${maxJogadores} jogadores inscritos para encerrar as inscrições. Atualmente: ${totalInscritos}/${maxJogadores}.`}
        </Alert>
      );
    }

    if (isReiDaPraia) {
      if (totalInscritos < 8) {
        return (
          <Alert title="Rei da Praia">
            Você precisa de pelo menos 8 jogadores inscritos (múltiplo de 4)
            para encerrar as inscrições.
          </Alert>
        );
      }
      const proximos = proximosValidos(totalInscritos, 4);
      return (
        proximos && (
          <Alert title="Rei da Praia">
            <p>
              {`Você tem ${totalInscritos} jogadores. O número deve ser múltiplo de 4 para formar grupos completos.`}
            </p>
            <p>{proximos}</p>
          </Alert>
        )
      );
    }

    return (
      totalInscritos < 4 && (
        <Alert>
          Você precisa de pelo menos 4 jogadores inscritos (número par) para
          encerrar as inscrições.
        </Alert>
      )
    );
  };

  return (
    <Cartao>
      <CartaoTitulo>Ações Administrativas</CartaoTitulo>

      <Acoes>
        {inscricoesAbertas && totalInscritos >= 4 && (
          <Button onClick={onEncerrarInscricoes}>Encerrar Inscrições</Button>
        )}

        {podeGerar && (
          <>
            <Button
              onClick={onGerarChaves}
              disabled={!inscritosCompletos}
              title={inscritosCompletos ? undefined : mensagemIncompleto}
            >
              {`Gerar ${alvo}`}
            </Button>
            <Button variant="outline" onClick={onAbrirInscricoes}>
              Reabrir Inscrições
            </Button>
          </>
        )}

        {chavesGeradas && (
          <>
            <Button onClick={onVerChaves}>{`Ver ${alvo}`}</Button>
            {onSubstituirJogador && (
              <Button variant="outline" onClick={onSubstituirJogador}>
                Substituir Jogador
              </Button>
            )}
            {onExportarSumula && (
              <Button
                variant="outline"
                icon={<Download size={16} />}
                onClick={onExportarSumula}
                disabled={exportandoSumula}
              >
                {exportandoSumula ? "Exportando..." : "Exportar Súmula"}
              </Button>
            )}
            <Button variant="danger" onClick={onApagarChaves}>
              {`Apagar ${alvo}`}
            </Button>
          </>
        )}
      </Acoes>

      {renderRegraInscricao()}

      {podeGerar && !inscritosCompletos && (
        <Alert variant="warning" title="Inscrições incompletas">
          {mensagemIncompleto}
        </Alert>
      )}

      {totalInscritos > 0 && !chavesGeradas && (
        <Alert variant="warning" title="Atenção">
          {`Para excluir esta etapa, você precisa cancelar todas as ${totalInscritos} inscrição(ões) primeiro.`}
        </Alert>
      )}

      {chavesGeradas && (
        <Alert title="Bloqueado">
          Não é possível excluir etapa após geração de chaves.
        </Alert>
      )}
    </Cartao>
  );
};

export default ActionsSection;
