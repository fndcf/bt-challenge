/**
 * Responsabilidade única: Configuração de formação e número de jogadores
 */

import React from "react";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Checkbox, Input, Select } from "@/components/ui";
import {
  FormatoEtapa,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
  TipoFormacaoJogos,
  VarianteSuperX,
  VarianteTeams,
} from "@/types/etapa";
import { MAX_EQUIPES_TEAMS } from "@/utils/etapa";
import { OpcoesPontuacao, OpcoesPontuacaoProps } from "./OpcoesPontuacao";

export interface ConfiguracoesJogadoresProps
  extends Omit<OpcoesPontuacaoProps, "bloqueado"> {
  maxJogadores: number;
  grupoUnico?: boolean;
  varianteSuperX?: VarianteSuperX;
  varianteTeams?: VarianteTeams;
  tipoFormacaoEquipe?: TipoFormacaoEquipe;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  tipoFormacaoDupla?: TipoFormacaoDupla;
  onMaxJogadoresChange: (value: number) => void;
  onGrupoUnicoChange?: (value: boolean) => void;
  onVarianteSuperXChange?: (value: VarianteSuperX) => void;
  onVarianteTeamsChange?: (value: VarianteTeams) => void;
  onTipoFormacaoEquipeChange?: (value: TipoFormacaoEquipe) => void;
  onTipoFormacaoJogosChange?: (value: TipoFormacaoJogos) => void;
  onTipoFormacaoDuplaChange?: (value: TipoFormacaoDupla) => void;
}

const FORMACAO_DUPLA = [
  {
    value: TipoFormacaoDupla.MESMO_NIVEL,
    label: "Mesmo Nível (jogadores do mesmo nível)",
  },
  {
    value: TipoFormacaoDupla.BALANCEADO,
    label: "Balanceado (Avançado + Iniciante, Intermediários entre si)",
  },
  {
    value: TipoFormacaoDupla.MANUAL,
    label: "Manual (organizador define as duplas)",
  },
];

const AJUDA_FORMACAO_DUPLA: Record<TipoFormacaoDupla, string> = {
  [TipoFormacaoDupla.MESMO_NIVEL]:
    "Todas as duplas terão jogadores do mesmo nível",
  [TipoFormacaoDupla.BALANCEADO]:
    "Permite misturar jogadores de diferentes níveis",
  [TipoFormacaoDupla.MANUAL]:
    "O organizador definirá as duplas manualmente antes de gerar chaves",
};

const VARIANTES_SUPER_X = [
  {
    value: VarianteSuperX.SUPER_8,
    label: "Super 8 (8 jogadores, 7 rodadas)",
  },
  {
    value: VarianteSuperX.SUPER_12,
    label: "Super 12 (12 jogadores, 11 rodadas)",
  },
];

const VARIANTES_TEAMS = [
  {
    value: VarianteTeams.TEAMS_4,
    label: "TEAMS 4 (4 jogadores por equipe, 2 jogos + decider)",
  },
  {
    value: VarianteTeams.TEAMS_6,
    label: "TEAMS 6 (6 jogadores por equipe, 3 jogos)",
  },
];

const FORMACAO_EQUIPE = [
  {
    value: TipoFormacaoEquipe.BALANCEADO,
    label: "Balanceado (distribuição equilibrada por nível)",
  },
  {
    value: TipoFormacaoEquipe.MESMO_NIVEL,
    label: "Mesmo Nível (apenas jogadores do mesmo nível)",
  },
  {
    value: TipoFormacaoEquipe.MANUAL,
    label: "Manual (organizador define as equipes)",
  },
];

const FORMACAO_JOGOS = [
  {
    value: TipoFormacaoJogos.SORTEIO,
    label: "Automático (sistema sorteia as duplas)",
  },
  {
    value: TipoFormacaoJogos.MANUAL,
    label: "Manual (equipes escolhem as duplas)",
  },
];

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
  grupoUnico = false,
  varianteSuperX = VarianteSuperX.SUPER_8,
  varianteTeams = VarianteTeams.TEAMS_4,
  tipoFormacaoEquipe = TipoFormacaoEquipe.BALANCEADO,
  tipoFormacaoJogos = TipoFormacaoJogos.SORTEIO,
  tipoFormacaoDupla = TipoFormacaoDupla.MESMO_NIVEL,
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
  const isDuplaFixa = formato === FormatoEtapa.DUPLA_FIXA;

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

      {isDuplaFixa && (
        <Select
          label="Tipo de Formação de Duplas"
          required
          fullWidth
          options={FORMACAO_DUPLA}
          value={tipoFormacaoDupla}
          onChange={(e) =>
            onTipoFormacaoDuplaChange?.(e.target.value as TipoFormacaoDupla)
          }
          helperText={AJUDA_FORMACAO_DUPLA[tipoFormacaoDupla]}
        />
      )}

      {isSuperX && (
        <Select
          label="Variante do Super X"
          required
          fullWidth
          options={VARIANTES_SUPER_X}
          value={varianteSuperX}
          onChange={(e) => {
            const variante = parseInt(e.target.value) as VarianteSuperX;
            onVarianteSuperXChange?.(variante);
            // O número de jogadores acompanha a variante
            onMaxJogadoresChange(variante);
          }}
          helperText="Selecione o número de jogadores para o torneio Super X"
        />
      )}

      {isTeams && (
        <>
          <Select
            label="Variante TEAMS"
            required
            fullWidth
            options={VARIANTES_TEAMS}
            value={varianteTeams}
            onChange={(e) =>
              onVarianteTeamsChange?.(parseInt(e.target.value) as VarianteTeams)
            }
            helperText="Selecione o número de jogadores por equipe"
          />
          <Select
            label="Tipo de Formação de Equipes"
            required
            fullWidth
            options={FORMACAO_EQUIPE}
            value={tipoFormacaoEquipe}
            onChange={(e) =>
              onTipoFormacaoEquipeChange?.(
                e.target.value as TipoFormacaoEquipe
              )
            }
            helperText="Como os jogadores serão distribuídos nas equipes"
          />
          <Select
            label="Formação das Partidas"
            required
            fullWidth
            options={FORMACAO_JOGOS}
            value={tipoFormacaoJogos}
            onChange={(e) =>
              onTipoFormacaoJogosChange?.(e.target.value as TipoFormacaoJogos)
            }
            helperText="Como as duplas serão formadas dentro de cada confronto"
          />
        </>
      )}

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
        {isDuplaFixa && onGrupoUnicoChange && (
          <Checkbox
            id="grupoUnico"
            label="Grupo único (todos contra todos)"
            checked={grupoUnico}
            onChange={onGrupoUnicoChange}
            helperText="Todas as duplas jogam entre si em um único grupo, sem divisão em múltiplos grupos"
          />
        )}
        <OpcoesPontuacao formato={formato} {...opcoesPontuacao} />
      </Campos>
    </Cartao>
  );
};

export default ConfiguracoesJogadores;
