/**
 * Responsabilidade única: Configuração de número de jogadores no modo edição
 */

import React from "react";
import {
  OpcoesPontuacao,
  OpcoesPontuacaoProps,
} from "../../CriarEtapa/components/OpcoesPontuacao";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Input } from "@/components/ui";
import { FormatoEtapa, VarianteTeams } from "@/types/etapa";
import { MAX_EQUIPES_TEAMS } from "@/utils/etapa";

export interface ConfiguracoesJogadoresEditProps
  extends Omit<OpcoesPontuacaoProps, "bloqueado"> {
  maxJogadores: number | undefined;
  varianteTeams?: VarianteTeams;
  chavesGeradas: boolean;
  temInscritos: boolean;
  totalInscritos: number;
  minimoJogadores: number;
  onMaxJogadoresChange: (value: number | undefined) => void;
  onBlur: (value: number) => void;
}

const getLimites = (formato: FormatoEtapa, varianteTeams: number) => {
  switch (formato) {
    case FormatoEtapa.TEAMS:
      return {
        max: varianteTeams * MAX_EQUIPES_TEAMS,
        passo: varianteTeams,
        exemplo: `Ex: ${varianteTeams * 2}, ${varianteTeams * 3}, ${varianteTeams * 4}...`,
        regra: `múltiplo de ${varianteTeams}`,
        ajuda: `Múltiplo de ${varianteTeams} (mín: ${varianteTeams * 2}, máx: ${
          varianteTeams * MAX_EQUIPES_TEAMS
        }, ${MAX_EQUIPES_TEAMS} equipes)`,
      };
    case FormatoEtapa.REI_DA_PRAIA:
      return {
        max: 64,
        passo: 4,
        exemplo: "Ex: 8, 12, 16, 20...",
        regra: "múltiplo de 4",
        ajuda: "Múltiplo de 4 (mín: 8, máx: 64)",
      };
    default:
      return {
        max: 52,
        passo: 2,
        exemplo: "Ex: 16, 20, 24...",
        regra: "número par",
        ajuda: "Número par (mín: 6, máx: 52)",
      };
  }
};

export const ConfiguracoesJogadoresEdit: React.FC<
  ConfiguracoesJogadoresEditProps
> = ({
  maxJogadores,
  formato,
  varianteTeams = VarianteTeams.TEAMS_4,
  chavesGeradas,
  temInscritos,
  totalInscritos,
  minimoJogadores,
  onMaxJogadoresChange,
  onBlur,
  ...opcoesPontuacao
}) => {
  const isSuperX = formato === FormatoEtapa.SUPER_X;
  const limites = getLimites(formato, varianteTeams);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value);
    onMaxJogadoresChange(isNaN(valor) ? undefined : valor);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== "") onBlur(parseInt(e.target.value));
  };

  const getAjuda = () => {
    if (isSuperX) {
      return `Super X tem número fixo de jogadores (${maxJogadores}) - não pode ser alterado`;
    }
    return temInscritos
      ? `Mínimo de ${minimoJogadores} (${totalInscritos} inscritos) - ${limites.regra}`
      : limites.ajuda;
  };

  return (
    <Cartao>
      <CartaoTitulo>Configurações</CartaoTitulo>

      <Input
        label="Número Máximo de Jogadores"
        type="number"
        required
        fullWidth
        min={minimoJogadores}
        max={limites.max}
        step={limites.passo}
        disabled={chavesGeradas || isSuperX}
        value={maxJogadores || ""}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={limites.exemplo}
        helperText={getAjuda()}
      />

      <Campos>
        <OpcoesPontuacao
          formato={formato}
          bloqueado={chavesGeradas}
          {...opcoesPontuacao}
        />
      </Campos>
    </Cartao>
  );
};

export default ConfiguracoesJogadoresEdit;
