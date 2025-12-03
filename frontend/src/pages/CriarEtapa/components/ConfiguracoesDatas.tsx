/**
 * ConfiguracoesDatas.tsx
 *
 * Responsabilidade única: Formulário de configuração de datas da etapa
 */

import React from "react";
import { ErrosDatas } from "../hooks/useCriarEtapa";
import * as S from "../CriarEtapa.styles";

export interface ConfiguracoesDataProps {
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  errosDatas: ErrosDatas;
  disabled?: boolean;
  onDataInicioChange: (data: string) => void;
  onDataFimChange: (data: string) => void;
  onDataRealizacaoChange: (data: string) => void;
}

export const ConfiguracoesDatas: React.FC<ConfiguracoesDataProps> = ({
  dataInicio,
  dataFim,
  dataRealizacao,
  errosDatas,
  disabled = false,
  onDataInicioChange,
  onDataFimChange,
  onDataRealizacaoChange,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Datas</S.CardTitle>

      <S.GridContainer>
        <S.Field>
          <S.Label>Início das Inscrições *</S.Label>
          <S.Input
            type="date"
            required
            disabled={disabled}
            $hasError={!!errosDatas.dataInicio}
            value={dataInicio}
            onChange={(e) => onDataInicioChange(e.target.value)}
          />
          {errosDatas.dataInicio && (
            <S.HelperText $error>⚠️ {errosDatas.dataInicio}</S.HelperText>
          )}
        </S.Field>

        <S.Field>
          <S.Label>Fim das Inscrições *</S.Label>
          <S.Input
            type="date"
            required
            disabled={disabled}
            $hasError={!!errosDatas.dataFim}
            value={dataFim}
            onChange={(e) => onDataFimChange(e.target.value)}
          />
          {errosDatas.dataFim && (
            <S.HelperText $error>⚠️ {errosDatas.dataFim}</S.HelperText>
          )}
        </S.Field>

        <S.Field>
          <S.Label>Data de Realização *</S.Label>
          <S.Input
            type="date"
            required
            disabled={disabled}
            $hasError={!!errosDatas.dataRealizacao}
            value={dataRealizacao}
            onChange={(e) => onDataRealizacaoChange(e.target.value)}
          />
          {errosDatas.dataRealizacao && (
            <S.HelperText $error>⚠️ {errosDatas.dataRealizacao}</S.HelperText>
          )}
        </S.Field>
      </S.GridContainer>
    </S.Card>
  );
};

export default ConfiguracoesDatas;
