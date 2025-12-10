/**
 * Responsabilidade única: Configuração de número de jogadores
 */

import React from "react";
import { FormatoEtapa, VarianteSuperX } from "@/types/etapa";
import * as S from "../CriarEtapa.styles";

export interface ConfiguracoesJogadoresProps {
  maxJogadores: number;
  formato: FormatoEtapa;
  contaPontosRanking: boolean;
  varianteSuperX?: VarianteSuperX;
  onMaxJogadoresChange: (value: number) => void;
  onContaPontosRankingChange: (value: boolean) => void;
  onVarianteSuperXChange?: (value: VarianteSuperX) => void;
}

export const ConfiguracoesJogadores: React.FC<ConfiguracoesJogadoresProps> = ({
  maxJogadores,
  formato,
  contaPontosRanking,
  varianteSuperX,
  onMaxJogadoresChange,
  onContaPontosRankingChange,
  onVarianteSuperXChange,
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
    // Super X: valor é fixo pela variante selecionada, não precisa de ajuste no blur
  };

  const handleVarianteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value) as VarianteSuperX;
    if (onVarianteSuperXChange) {
      onVarianteSuperXChange(value);
    }
    // Também atualiza maxJogadores para corresponder à variante
    onMaxJogadoresChange(value);
  };

  // Para Super X, o campo de jogadores é somente leitura (controlado pela variante)
  const isSuperX = formato === FormatoEtapa.SUPER_X;

  return (
    <S.Card>
      <S.CardTitle>Configurações</S.CardTitle>

      <S.FieldsContainer>
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

        {/* Campo de Jogadores - oculto para Super X pois é controlado pela variante */}
        {!isSuperX && (
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
