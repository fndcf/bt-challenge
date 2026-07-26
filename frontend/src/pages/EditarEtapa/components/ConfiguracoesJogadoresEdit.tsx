/**
 * Responsabilidade única: Configuração de número de jogadores no modo edição
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import * as S from "../EditarEtapa.styles";

export interface ConfiguracoesJogadoresEditProps {
  maxJogadores: number | undefined;
  formato: FormatoEtapa;
  chavesGeradas: boolean;
  temInscritos: boolean;
  totalInscritos: number;
  minimoJogadores: number;
  contaPontosRanking: boolean;
  darPontosParticipacao: boolean;
  melhorDe3: boolean;
  melhorDe3Eliminatoria: boolean;
  onMaxJogadoresChange: (value: number | undefined) => void;
  onBlur: (value: number) => void;
  onContaPontosRankingChange: (value: boolean) => void;
  onDarPontosParticipacaoChange: (value: boolean) => void;
  onMelhorDe3Change: (value: boolean) => void;
  onMelhorDe3EliminatoriaChange: (value: boolean) => void;
}

export const ConfiguracoesJogadoresEdit: React.FC<
  ConfiguracoesJogadoresEditProps
> = ({
  maxJogadores,
  formato,
  chavesGeradas,
  temInscritos,
  totalInscritos,
  minimoJogadores,
  contaPontosRanking,
  darPontosParticipacao,
  melhorDe3,
  melhorDe3Eliminatoria,
  onMaxJogadoresChange,
  onBlur,
  onContaPontosRankingChange,
  onDarPontosParticipacaoChange,
  onMelhorDe3Change,
  onMelhorDe3EliminatoriaChange,
}) => {
  const isReiDaPraia = formato === FormatoEtapa.REI_DA_PRAIA;
  const isSuperX = formato === FormatoEtapa.SUPER_X;
  const isTeams = formato === FormatoEtapa.TEAMS;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onMaxJogadoresChange(undefined);
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        onMaxJogadoresChange(numValue);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== "") {
      const valor = parseInt(e.target.value);
      onBlur(valor);
    }
  };

  return (
    <S.Card>
      <S.CardTitle>Configurações</S.CardTitle>

      <S.FieldsContainer>
        <S.Field>
          <S.Label>
            Número Máximo de Jogadores <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="number"
            required
            min={minimoJogadores}
            max={isTeams ? 144 : isReiDaPraia ? 64 : 52}
            step={isTeams ? 4 : isReiDaPraia ? 4 : 2}
            disabled={chavesGeradas || isSuperX}
            value={maxJogadores || ""}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={
              isTeams ? "Ex: 8, 12, 16, 24..." : isReiDaPraia ? "Ex: 8, 12, 16, 20..." : "Ex: 16, 20, 24..."
            }
          />

          {/* Helper text específico por formato e estado */}
          {isSuperX ? (
            <S.HelperText>
              Super X tem número fixo de jogadores ({maxJogadores}) - não pode ser alterado
            </S.HelperText>
          ) : isTeams ? (
            <S.HelperText>
              {temInscritos
                ? `Mínimo de ${minimoJogadores} (${totalInscritos} inscritos) - múltiplo de 4`
                : "Múltiplo de 4 (TEAMS 4: máx 96, TEAMS 6: máx 144)"}
            </S.HelperText>
          ) : isReiDaPraia ? (
            <S.HelperText>
              {temInscritos
                ? `Mínimo de ${minimoJogadores} (${totalInscritos} inscritos) - múltiplo de 4`
                : "Múltiplo de 4 (mín: 8, máx: 64)"}
            </S.HelperText>
          ) : (
            <S.HelperText>
              {temInscritos
                ? `Mínimo de ${minimoJogadores} (${totalInscritos} inscritos) - número par`
                : "Número par (mín: 6, máx: 52)"}
            </S.HelperText>
          )}
        </S.Field>

        <S.Field>
          <S.CheckboxContainer>
            <S.Checkbox
              type="checkbox"
              id="contaPontosRanking"
              checked={contaPontosRanking}
              onChange={(e) => onContaPontosRankingChange(e.target.checked)}
              disabled={chavesGeradas}
            />
            <S.CheckboxLabel htmlFor="contaPontosRanking">
              Conta pontos no ranking
            </S.CheckboxLabel>
          </S.CheckboxContainer>
          <S.HelperText>
            {chavesGeradas
              ? "Não é possível alterar após gerar as chaves"
              : "Se desmarcado, as estatísticas dos jogos serão registradas, mas não somarão pontos no ranking geral"}
          </S.HelperText>
        </S.Field>

        {contaPontosRanking && !isSuperX && (
          <S.Field>
            <S.CheckboxContainer>
              <S.Checkbox
                type="checkbox"
                id="darPontosParticipacao"
                checked={darPontosParticipacao}
                onChange={(e) => onDarPontosParticipacaoChange(e.target.checked)}
                disabled={chavesGeradas}
              />
              <S.CheckboxLabel htmlFor="darPontosParticipacao">
                Dar pontos de participação
              </S.CheckboxLabel>
            </S.CheckboxContainer>
            <S.HelperText>
              {chavesGeradas
                ? "Não é possível alterar após gerar as chaves"
                : "Se desmarcado, quem não se classificar/colocar não recebe pontos de participação — apenas quem chegar em alguma colocação pontua"}
            </S.HelperText>
          </S.Field>
        )}

        <S.Field>
          <S.CheckboxContainer>
            <S.Checkbox
              type="checkbox"
              id="melhorDe3"
              checked={melhorDe3}
              onChange={(e) => onMelhorDe3Change(e.target.checked)}
              disabled={chavesGeradas}
            />
            <S.CheckboxLabel htmlFor="melhorDe3">
              Partidas melhor de 3 sets
            </S.CheckboxLabel>
          </S.CheckboxContainer>
          <S.HelperText>
            {chavesGeradas
              ? "Não é possível alterar após gerar as chaves"
              : "Ao lançar o resultado, serão pedidos 2 sets; se cada lado vencer um, abre um 3º set de desempate"}
          </S.HelperText>
        </S.Field>

        {melhorDe3 && (
          <S.Field>
            <S.CheckboxContainer>
              <S.Checkbox
                type="checkbox"
                id="melhorDe3Eliminatoria"
                checked={melhorDe3Eliminatoria}
                onChange={(e) => onMelhorDe3EliminatoriaChange(e.target.checked)}
                disabled={chavesGeradas}
              />
              <S.CheckboxLabel htmlFor="melhorDe3Eliminatoria">
                Aplicar também na fase eliminatória (mata-mata)
              </S.CheckboxLabel>
            </S.CheckboxContainer>
            <S.HelperText>
              {chavesGeradas
                ? "Não é possível alterar após gerar as chaves"
                : "Se desmarcado, o mata-mata continua sendo decidido em 1 set único"}
            </S.HelperText>
          </S.Field>
        )}
      </S.FieldsContainer>
    </S.Card>
  );
};

export default ConfiguracoesJogadoresEdit;
