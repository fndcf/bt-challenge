/**
 * Responsabilidade única: Configuração de número de jogadores
 */

import React from "react";
import { FormatoEtapa, VarianteSuperX, VarianteTeams, TipoFormacaoEquipe, TipoFormacaoJogos, TipoFormacaoDupla } from "@/types/etapa";
import * as S from "../CriarEtapa.styles";

export interface ConfiguracoesJogadoresProps {
  maxJogadores: number;
  formato: FormatoEtapa;
  contaPontosRanking: boolean;
  varianteSuperX?: VarianteSuperX;
  varianteTeams?: VarianteTeams;
  tipoFormacaoEquipe?: TipoFormacaoEquipe;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  tipoFormacaoDupla?: TipoFormacaoDupla;
  onMaxJogadoresChange: (value: number) => void;
  onContaPontosRankingChange: (value: boolean) => void;
  onVarianteSuperXChange?: (value: VarianteSuperX) => void;
  onVarianteTeamsChange?: (value: VarianteTeams) => void;
  onTipoFormacaoEquipeChange?: (value: TipoFormacaoEquipe) => void;
  onTipoFormacaoJogosChange?: (value: TipoFormacaoJogos) => void;
  onTipoFormacaoDuplaChange?: (value: TipoFormacaoDupla) => void;
}

export const ConfiguracoesJogadores: React.FC<ConfiguracoesJogadoresProps> = ({
  maxJogadores,
  formato,
  contaPontosRanking,
  varianteSuperX,
  varianteTeams,
  tipoFormacaoEquipe,
  tipoFormacaoJogos,
  tipoFormacaoDupla,
  onMaxJogadoresChange,
  onContaPontosRankingChange,
  onVarianteSuperXChange,
  onVarianteTeamsChange,
  onTipoFormacaoEquipeChange,
  onTipoFormacaoJogosChange,
  onTipoFormacaoDuplaChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite digitação livre, inclusive valores vazios
    if (value === "") {
      onMaxJogadoresChange(0);
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        onMaxJogadoresChange(numValue);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value);

    if (formato === FormatoEtapa.REI_DA_PRAIA) {
      // Rei da Praia: mínimo 8, máximo 64, múltiplo de 4
      if (isNaN(valor) || valor < 8) {
        onMaxJogadoresChange(8);
      } else if (valor > 64) {
        onMaxJogadoresChange(64);
      } else if (valor % 4 !== 0) {
        onMaxJogadoresChange(Math.ceil(valor / 4) * 4);
      }
    } else if (formato === FormatoEtapa.DUPLA_FIXA) {
      // Dupla Fixa: mínimo 6, máximo 52, par
      if (isNaN(valor) || valor < 6) {
        onMaxJogadoresChange(6);
      } else if (valor > 52) {
        onMaxJogadoresChange(52);
      } else if (valor % 2 !== 0) {
        onMaxJogadoresChange(valor + 1);
      }
    }
    // Super X e TEAMS: valor é fixo pela variante selecionada, não precisa de ajuste no blur
  };

  const handleVarianteTeamsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value) as VarianteTeams;
    if (onVarianteTeamsChange) {
      onVarianteTeamsChange(value);
    }
  };

  const handleTipoFormacaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TipoFormacaoEquipe;
    if (onTipoFormacaoEquipeChange) {
      onTipoFormacaoEquipeChange(value);
    }
  };

  const handleTipoFormacaoJogosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TipoFormacaoJogos;
    if (onTipoFormacaoJogosChange) {
      onTipoFormacaoJogosChange(value);
    }
  };

  const handleTipoFormacaoDuplaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TipoFormacaoDupla;
    if (onTipoFormacaoDuplaChange) {
      onTipoFormacaoDuplaChange(value);
    }
  };

  const handleVarianteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value) as VarianteSuperX;
    if (onVarianteSuperXChange) {
      onVarianteSuperXChange(value);
    }
    // Também atualiza maxJogadores para corresponder à variante
    onMaxJogadoresChange(value);
  };

  // Para Super X e TEAMS, o campo de jogadores é somente leitura (controlado pela variante)
  const isSuperX = formato === FormatoEtapa.SUPER_X;
  const isTeams = formato === FormatoEtapa.TEAMS;
  const isDuplaFixa = formato === FormatoEtapa.DUPLA_FIXA;

  return (
    <S.Card>
      <S.CardTitle>Configurações</S.CardTitle>

      <S.FieldsContainer>
        {/* Seletor de Tipo de Formação - apenas para Dupla Fixa */}
        {isDuplaFixa && (
          <S.Field>
            <S.Label>Tipo de Formação de Duplas *</S.Label>
            <S.Select
              required
              value={tipoFormacaoDupla || TipoFormacaoDupla.MESMO_NIVEL}
              onChange={handleTipoFormacaoDuplaChange}
            >
              <option value={TipoFormacaoDupla.MESMO_NIVEL}>
                Mesmo Nível (jogadores do mesmo nível)
              </option>
              <option value={TipoFormacaoDupla.BALANCEADO}>
                Balanceado (Avançado + Iniciante, Intermediários entre si)
              </option>
            </S.Select>
            <S.HelperText>
              {tipoFormacaoDupla === TipoFormacaoDupla.BALANCEADO
                ? "Permite misturar jogadores de diferentes níveis"
                : "Todas as duplas terão jogadores do mesmo nível"}
            </S.HelperText>
          </S.Field>
        )}

        {/* Seletor de Variante - apenas para Super X */}
        {isSuperX && (
          <S.Field>
            <S.Label>Variante do Super X *</S.Label>
            <S.Select
              required
              value={varianteSuperX || VarianteSuperX.SUPER_8}
              onChange={handleVarianteChange}
            >
              <option value={VarianteSuperX.SUPER_8}>
                Super 8 (8 jogadores, 7 rodadas)
              </option>
              <option value={VarianteSuperX.SUPER_12}>
                Super 12 (12 jogadores, 11 rodadas)
              </option>
            </S.Select>
            <S.HelperText>
              Selecione o número de jogadores para o torneio Super X
            </S.HelperText>
          </S.Field>
        )}

        {/* Seletor de Variante - apenas para TEAMS */}
        {isTeams && (
          <>
            <S.Field>
              <S.Label>Variante TEAMS *</S.Label>
              <S.Select
                required
                value={varianteTeams || VarianteTeams.TEAMS_4}
                onChange={handleVarianteTeamsChange}
              >
                <option value={VarianteTeams.TEAMS_4}>
                  TEAMS 4 (4 jogadores por equipe, 2 jogos + decider)
                </option>
                <option value={VarianteTeams.TEAMS_6}>
                  TEAMS 6 (6 jogadores por equipe, 3 jogos)
                </option>
              </S.Select>
              <S.HelperText>
                Selecione o número de jogadores por equipe
              </S.HelperText>
            </S.Field>

            <S.Field>
              <S.Label>Tipo de Formação de Equipes *</S.Label>
              <S.Select
                required
                value={tipoFormacaoEquipe || TipoFormacaoEquipe.BALANCEADO}
                onChange={handleTipoFormacaoChange}
              >
                <option value={TipoFormacaoEquipe.BALANCEADO}>
                  Balanceado (distribuição equilibrada por nível)
                </option>
                <option value={TipoFormacaoEquipe.MESMO_NIVEL}>
                  Mesmo Nível (apenas jogadores do mesmo nível)
                </option>
                <option value={TipoFormacaoEquipe.MANUAL}>
                  Manual (organizador define as equipes)
                </option>
              </S.Select>
              <S.HelperText>
                Como os jogadores serão distribuídos nas equipes
              </S.HelperText>
            </S.Field>

            <S.Field>
              <S.Label>Formação das Partidas *</S.Label>
              <S.Select
                required
                value={tipoFormacaoJogos || TipoFormacaoJogos.SORTEIO}
                onChange={handleTipoFormacaoJogosChange}
              >
                <option value={TipoFormacaoJogos.SORTEIO}>
                  Automático (sistema sorteia as duplas)
                </option>
                <option value={TipoFormacaoJogos.MANUAL}>
                  Manual (equipes escolhem as duplas)
                </option>
              </S.Select>
              <S.HelperText>
                Como as duplas serão formadas dentro de cada confronto
              </S.HelperText>
            </S.Field>

            <S.Field>
              <S.Label>Número de Jogadores *</S.Label>
              <S.Input
                type="number"
                required
                min={varianteTeams === VarianteTeams.TEAMS_6 ? "12" : "8"}
                max="60"
                step={varianteTeams || VarianteTeams.TEAMS_4}
                value={maxJogadores || ""}
                onChange={handleInputChange}
                onBlur={(e) => {
                  const valor = parseInt(e.target.value);
                  const variante = varianteTeams || VarianteTeams.TEAMS_4;
                  const minimo = variante * 2; // Mínimo de 2 equipes
                  if (isNaN(valor) || valor < minimo) {
                    onMaxJogadoresChange(minimo);
                  } else if (valor % variante !== 0) {
                    onMaxJogadoresChange(Math.ceil(valor / variante) * variante);
                  }
                }}
              />
              <S.HelperText>
                Múltiplo de {varianteTeams || 4} (mín: {(varianteTeams || 4) * 2} para 2 equipes)
              </S.HelperText>
            </S.Field>
          </>
        )}

        {/* Campo de Jogadores - oculto para Super X e TEAMS pois tem campos específicos */}
        {!isSuperX && !isTeams && (
          <S.Field>
            <S.Label>Máximo de Jogadores *</S.Label>
            <S.Input
              type="number"
              required
              min={formato === FormatoEtapa.REI_DA_PRAIA ? "8" : "6"}
              max={formato === FormatoEtapa.REI_DA_PRAIA ? "64" : "52"}
              step={formato === FormatoEtapa.REI_DA_PRAIA ? "4" : "2"}
              value={maxJogadores || ""}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />
            <S.HelperText>
              {formato === FormatoEtapa.REI_DA_PRAIA
                ? "Múltiplo de 4 (mín: 8, máx: 64)"
                : "Número par (mín: 6, máx: 52)"}
            </S.HelperText>
          </S.Field>
        )}

        <S.Field>
          <S.CheckboxContainer>
            <S.Checkbox
              type="checkbox"
              id="contaPontosRanking"
              checked={contaPontosRanking}
              onChange={(e) => onContaPontosRankingChange(e.target.checked)}
            />
            <S.CheckboxLabel htmlFor="contaPontosRanking">
              Conta pontos no ranking
            </S.CheckboxLabel>
          </S.CheckboxContainer>
          <S.HelperText>
            Se desmarcado, as estatísticas dos jogos serão registradas, mas não
            somarão pontos no ranking geral
          </S.HelperText>
        </S.Field>
      </S.FieldsContainer>
    </S.Card>
  );
};

export default ConfiguracoesJogadores;
