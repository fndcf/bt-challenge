/**
 * Responsabilidade única: Opções de pontuação e de sets da etapa
 * (criação e edição)
 */

import React from "react";
import { Checkbox } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";

export interface OpcoesPontuacaoProps {
  formato: FormatoEtapa;
  contaPontosRanking: boolean;
  darPontosParticipacao: boolean;
  melhorDe3: boolean;
  melhorDe3Eliminatoria: boolean;
  onContaPontosRankingChange: (value: boolean) => void;
  onDarPontosParticipacaoChange: (value: boolean) => void;
  onMelhorDe3Change: (value: boolean) => void;
  onMelhorDe3EliminatoriaChange: (value: boolean) => void;
  /** Chaves geradas: nada pode mudar */
  bloqueado?: boolean;
}

export const OpcoesPontuacao: React.FC<OpcoesPontuacaoProps> = ({
  formato,
  contaPontosRanking,
  darPontosParticipacao,
  melhorDe3,
  melhorDe3Eliminatoria,
  onContaPontosRankingChange,
  onDarPontosParticipacaoChange,
  onMelhorDe3Change,
  onMelhorDe3EliminatoriaChange,
  bloqueado = false,
}) => {
  const ajuda = (texto: string) =>
    bloqueado ? "Não é possível alterar após gerar as chaves" : texto;

  return (
    <>
      <Checkbox
        id="contaPontosRanking"
        label="Conta pontos no ranking"
        checked={contaPontosRanking}
        onChange={onContaPontosRankingChange}
        disabled={bloqueado}
        helperText={ajuda(
          "Se desmarcado, as estatísticas dos jogos serão registradas, mas não somarão pontos no ranking geral"
        )}
      />

      {/* Super X não tem faixa de participação: todos pontuam pela colocação */}
      {contaPontosRanking && formato !== FormatoEtapa.SUPER_X && (
        <Checkbox
          id="darPontosParticipacao"
          label="Dar pontos de participação"
          checked={darPontosParticipacao}
          onChange={onDarPontosParticipacaoChange}
          disabled={bloqueado}
          helperText={ajuda(
            "Se desmarcado, quem não se classificar/colocar não recebe pontos de participação — apenas quem chegar em alguma colocação pontua"
          )}
        />
      )}

      <Checkbox
        id="melhorDe3"
        label="Partidas melhor de 3 sets"
        checked={melhorDe3}
        onChange={onMelhorDe3Change}
        disabled={bloqueado}
        helperText={ajuda(
          "Ao lançar o resultado, serão pedidos 2 sets; se cada lado vencer um, abre um 3º set de desempate"
        )}
      />

      {melhorDe3 && (
        <Checkbox
          id="melhorDe3Eliminatoria"
          label="Aplicar também na fase eliminatória (mata-mata)"
          checked={melhorDe3Eliminatoria}
          onChange={onMelhorDe3EliminatoriaChange}
          disabled={bloqueado}
          helperText={ajuda(
            "Se desmarcado, o mata-mata continua sendo decidido em 1 set único"
          )}
        />
      )}
    </>
  );
};

export default OpcoesPontuacao;
