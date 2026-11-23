/**
 * Responsabilidade única: Configuração de formação e número de jogadores
 */

import React from "react";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Input } from "@/components/ui";
import { FormatoEtapa, VarianteTeams } from "@/types/etapa";
import { MAX_EQUIPES_TEAMS } from "@/utils/etapa";
import { CamposFormato, CamposFormatoProps } from "./CamposFormato";
import { OpcoesPontuacao, OpcoesPontuacaoProps } from "./OpcoesPontuacao";

export interface ConfiguracoesJogadoresProps
  extends Omit<OpcoesPontuacaoProps, "bloqueado">,
    Omit<CamposFormatoProps, "formato" | "disabled" | "ajudaVariante"> {
  maxJogadores: number;
  onMaxJogadoresChange: (value: number) => void;
}

/** Limites do número de jogadores; Super X é fixo pela variante */
const getLimites = (formato: FormatoEtapa, varianteTeams: VarianteTeams) => {
  switch (formato) {
    case FormatoEtapa.REI_DA_PRAIA:
      return {
        min: 8,
        max: 64,
        multiplo: 4,
        ajuda: "Múltiplo de 4 (mín: 8, máx: 64)",
      };
    case FormatoEtapa.TEAMS:
      return {
        min: varianteTeams * 2,
        max: varianteTeams * MAX_EQUIPES_TEAMS,
        multiplo: varianteTeams,
        ajuda: `Múltiplo de ${varianteTeams} (mín: ${
          varianteTeams * 2
        }, máx: ${varianteTeams * MAX_EQUIPES_TEAMS}, ${MAX_EQUIPES_TEAMS} equipes)`,
      };
    default:
      return {
        min: 6,
        max: 52,
        multiplo: 2,
        ajuda: "Número par (mín: 6, máx: 52)",
      };
  }
};

export const ConfiguracoesJogadores: React.FC<ConfiguracoesJogadoresProps> = ({
  maxJogadores,
  formato,
  grupoUnico,
  varianteSuperX,
  varianteTeams = VarianteTeams.TEAMS_4,
  tipoFormacaoEquipe,
  tipoFormacaoJogos,
  tipoFormacaoDupla,
  onMaxJogadoresChange,
  onGrupoUnicoChange,
  onVarianteSuperXChange,
  onVarianteTeamsChange,
  onTipoFormacaoEquipeChange,
  onTipoFormacaoJogosChange,
  onTipoFormacaoDuplaChange,
  ...opcoesPontuacao
}) => {
  const isSuperX = formato === FormatoEtapa.SUPER_X;
  const isTeams = formato === FormatoEtapa.TEAMS;

  const { min, max, multiplo, ajuda } = getLimites(formato, varianteTeams);

  // Digitação livre (inclusive vazio); o valor é ajustado ao sair do campo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onMaxJogadoresChange(parseInt(e.target.value) || 0);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value) || 0;
    const noLimite = Math.min(Math.max(valor, min), max);
    const ajustado = Math.ceil(noLimite / multiplo) * multiplo;
    if (ajustado !== valor) onMaxJogadoresChange(ajustado);
  };

  return (
    <Cartao>
      <CartaoTitulo>Configurações</CartaoTitulo>

      <CamposFormato
        formato={formato}
        tipoFormacaoDupla={tipoFormacaoDupla}
        grupoUnico={grupoUnico}
        varianteSuperX={varianteSuperX}
        varianteTeams={varianteTeams}
        tipoFormacaoEquipe={tipoFormacaoEquipe}
        tipoFormacaoJogos={tipoFormacaoJogos}
        onTipoFormacaoDuplaChange={onTipoFormacaoDuplaChange}
        onGrupoUnicoChange={onGrupoUnicoChange}
        onVarianteSuperXChange={(variante) => {
          onVarianteSuperXChange?.(variante);
          // O número de jogadores acompanha a variante
          onMaxJogadoresChange(variante);
        }}
        onVarianteTeamsChange={onVarianteTeamsChange}
        onTipoFormacaoEquipeChange={onTipoFormacaoEquipeChange}
        onTipoFormacaoJogosChange={onTipoFormacaoJogosChange}
      />

      {!isSuperX && (
        <Input
          label={isTeams ? "Número de Jogadores" : "Máximo de Jogadores"}
          type="number"
          required
          fullWidth
          min={min}
          max={max}
          step={multiplo}
          value={maxJogadores || ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
          helperText={ajuda}
        />
      )}

      <Campos>
        <OpcoesPontuacao formato={formato} {...opcoesPontuacao} />
      </Campos>
    </Cartao>
  );
};

export default ConfiguracoesJogadores;
