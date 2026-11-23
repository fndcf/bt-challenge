/**
 * Responsabilidade única: campos que dependem do formato da etapa
 * (criação e edição)
 *
 * - Dupla Fixa: formação das duplas e grupo único
 * - Super X: variante (8 ou 12 jogadores)
 * - Teams: variante, formação das equipes e formação das partidas
 */

import React from "react";
import { Checkbox, Select } from "@/components/ui";
import {
  FormatoEtapa,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
  TipoFormacaoJogos,
  VarianteSuperX,
  VarianteTeams,
} from "@/types/etapa";

export interface CamposFormatoProps {
  formato: FormatoEtapa;
  tipoFormacaoDupla?: TipoFormacaoDupla;
  grupoUnico?: boolean;
  varianteSuperX?: VarianteSuperX;
  varianteTeams?: VarianteTeams;
  tipoFormacaoEquipe?: TipoFormacaoEquipe;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  onTipoFormacaoDuplaChange?: (value: TipoFormacaoDupla) => void;
  onGrupoUnicoChange?: (value: boolean) => void;
  onVarianteSuperXChange?: (value: VarianteSuperX) => void;
  onVarianteTeamsChange?: (value: VarianteTeams) => void;
  onTipoFormacaoEquipeChange?: (value: TipoFormacaoEquipe) => void;
  onTipoFormacaoJogosChange?: (value: TipoFormacaoJogos) => void;
  /** Chaves geradas: nada pode mudar */
  disabled?: boolean;
  /** Texto extra abaixo da variante (ex.: limite pelos inscritos) */
  ajudaVariante?: string;
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
  { value: VarianteSuperX.SUPER_8, label: "Super 8 (8 jogadores, 7 rodadas)" },
  { value: VarianteSuperX.SUPER_12, label: "Super 12 (12 jogadores, 11 rodadas)" },
];

const VARIANTES_TEAMS = [
  {
    value: VarianteTeams.TEAMS_4,
    label: "Teams 4 (4 jogadores por equipe, 2 jogos + decider)",
  },
  {
    value: VarianteTeams.TEAMS_6,
    label: "Teams 6 (6 jogadores por equipe, 3 jogos)",
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

export const CamposFormato: React.FC<CamposFormatoProps> = ({
  formato,
  tipoFormacaoDupla = TipoFormacaoDupla.MESMO_NIVEL,
  grupoUnico = false,
  varianteSuperX = VarianteSuperX.SUPER_8,
  varianteTeams = VarianteTeams.TEAMS_4,
  tipoFormacaoEquipe = TipoFormacaoEquipe.BALANCEADO,
  tipoFormacaoJogos = TipoFormacaoJogos.SORTEIO,
  onTipoFormacaoDuplaChange,
  onGrupoUnicoChange,
  onVarianteSuperXChange,
  onVarianteTeamsChange,
  onTipoFormacaoEquipeChange,
  onTipoFormacaoJogosChange,
  disabled = false,
  ajudaVariante,
}) => {
  if (formato === FormatoEtapa.DUPLA_FIXA) {
    return (
      <>
        <Select
          label="Tipo de Formação de Duplas"
          required
          fullWidth
          disabled={disabled}
          options={FORMACAO_DUPLA}
          value={tipoFormacaoDupla}
          onChange={(e) =>
            onTipoFormacaoDuplaChange?.(e.target.value as TipoFormacaoDupla)
          }
          helperText={AJUDA_FORMACAO_DUPLA[tipoFormacaoDupla]}
        />
        {onGrupoUnicoChange && (
          <Checkbox
            id="grupoUnico"
            label="Grupo único (todos contra todos)"
            checked={grupoUnico}
            onChange={onGrupoUnicoChange}
            disabled={disabled}
            helperText="Todas as duplas jogam entre si em um único grupo, sem divisão em múltiplos grupos"
          />
        )}
      </>
    );
  }

  if (formato === FormatoEtapa.SUPER_X) {
    return (
      <Select
        label="Variante do Super X"
        required
        fullWidth
        disabled={disabled}
        options={VARIANTES_SUPER_X}
        value={varianteSuperX}
        onChange={(e) =>
          onVarianteSuperXChange?.(parseInt(e.target.value) as VarianteSuperX)
        }
        helperText={
          ajudaVariante ?? "Selecione o número de jogadores para o torneio Super X"
        }
      />
    );
  }

  if (formato === FormatoEtapa.TEAMS) {
    return (
      <>
        <Select
          label="Variante Teams"
          required
          fullWidth
          disabled={disabled}
          options={VARIANTES_TEAMS}
          value={varianteTeams}
          onChange={(e) =>
            onVarianteTeamsChange?.(parseInt(e.target.value) as VarianteTeams)
          }
          helperText={ajudaVariante ?? "Selecione o número de jogadores por equipe"}
        />
        <Select
          label="Tipo de Formação de Equipes"
          required
          fullWidth
          disabled={disabled}
          options={FORMACAO_EQUIPE}
          value={tipoFormacaoEquipe}
          onChange={(e) =>
            onTipoFormacaoEquipeChange?.(e.target.value as TipoFormacaoEquipe)
          }
          helperText="Como os jogadores serão distribuídos nas equipes"
        />
        <Select
          label="Formação das Partidas"
          required
          fullWidth
          disabled={disabled}
          options={FORMACAO_JOGOS}
          value={tipoFormacaoJogos}
          onChange={(e) =>
            onTipoFormacaoJogosChange?.(e.target.value as TipoFormacaoJogos)
          }
          helperText="Como as duplas serão formadas dentro de cada confronto"
        />
      </>
    );
  }

  return null;
};

export default CamposFormato;
