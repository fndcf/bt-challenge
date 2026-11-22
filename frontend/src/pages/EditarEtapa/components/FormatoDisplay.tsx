/**
 * Responsabilidade única: Exibir formato da etapa (read-only) e permitir edição de chaveamento
 */

import React from "react";
import {
  Campos,
  Cartao,
  CartaoTitulo,
  Rotulo,
} from "@/components/layout/Pagina";
import { Badge, Select } from "@/components/ui";
import {
  FormatoEtapa,
  TipoFormacaoEquipe,
  TipoFormacaoJogos,
  VarianteSuperX,
  VarianteTeams,
} from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import {
  getChaveamentoLabel,
  getFormacaoEquipeLabel,
  getFormatoEtapaLabel,
} from "@/utils/etapa";

export interface FormatoDisplayProps {
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  chavesGeradas: boolean;
  onTipoChaveamentoChange: (tipo: TipoChaveamentoReiDaPraia) => void;
  varianteSuperX?: VarianteSuperX;
  // TEAMS props
  varianteTeams?: VarianteTeams;
  tipoFormacaoEquipe?: TipoFormacaoEquipe;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  onTipoFormacaoJogosChange?: (tipo: TipoFormacaoJogos) => void;
}

const CHAVEAMENTOS = Object.values(TipoChaveamentoReiDaPraia).map((tipo) => ({
  value: tipo,
  label: getChaveamentoLabel(tipo),
}));

const FORMACAO_JOGOS = [
  { value: TipoFormacaoJogos.SORTEIO, label: "Sorteio Aleatório" },
  { value: TipoFormacaoJogos.MANUAL, label: "Manual" },
];

const Informacao: React.FC<{ rotulo: string; children: React.ReactNode }> = ({
  rotulo,
  children,
}) => (
  <div>
    <Rotulo>{rotulo}</Rotulo>
    {children}
  </div>
);

export const FormatoDisplay: React.FC<FormatoDisplayProps> = ({
  formato,
  tipoChaveamento,
  chavesGeradas,
  onTipoChaveamentoChange,
  varianteSuperX,
  varianteTeams,
  tipoFormacaoEquipe,
  tipoFormacaoJogos,
  onTipoFormacaoJogosChange,
}) => {
  const isReiDaPraia = formato === FormatoEtapa.REI_DA_PRAIA;
  const isTeams = formato === FormatoEtapa.TEAMS;

  return (
    <Cartao>
      <CartaoTitulo>Formato</CartaoTitulo>

      <Campos $colunas>
        <Informacao rotulo="Formato da etapa">
          <Badge formato={formato}>
            {getFormatoEtapaLabel({ formato, varianteSuperX, varianteTeams })}
          </Badge>
        </Informacao>

        {isTeams && (
          <Informacao rotulo="Formação de equipes">
            <Badge>
              {tipoFormacaoEquipe
                ? getFormacaoEquipeLabel(tipoFormacaoEquipe)
                : "Não definido"}
            </Badge>
          </Informacao>
        )}
      </Campos>

      {isReiDaPraia && (
        <Select
          label="Tipo de Chaveamento"
          required
          fullWidth
          disabled={chavesGeradas}
          options={CHAVEAMENTOS}
          value={tipoChaveamento || ""}
          onChange={(e) =>
            onTipoChaveamentoChange(e.target.value as TipoChaveamentoReiDaPraia)
          }
          helperText="Define como as duplas serão formadas na fase eliminatória"
        />
      )}

      {isTeams && (
        <Select
          label="Formação das Partidas"
          required
          fullWidth
          disabled={chavesGeradas}
          options={FORMACAO_JOGOS}
          value={tipoFormacaoJogos || ""}
          onChange={(e) =>
            onTipoFormacaoJogosChange?.(e.target.value as TipoFormacaoJogos)
          }
          helperText="Define como os jogadores serão distribuídos nas partidas de cada confronto"
        />
      )}
    </Cartao>
  );
};

export default FormatoDisplay;
