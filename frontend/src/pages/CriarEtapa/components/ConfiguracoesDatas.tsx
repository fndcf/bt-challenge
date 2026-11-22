/**
 * Responsabilidade única: Datas da etapa
 */

import React from "react";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Input } from "@/components/ui";
import { ErrosDatas } from "../hooks/useCriarEtapa";

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
}) => (
  <Cartao>
    <CartaoTitulo>Datas</CartaoTitulo>
    <Campos $colunas>
      <Input
        label="Início das Inscrições"
        type="date"
        required
        fullWidth
        disabled={disabled}
        error={errosDatas.dataInicio}
        value={dataInicio}
        onChange={(e) => onDataInicioChange(e.target.value)}
      />
      <Input
        label="Fim das Inscrições"
        type="date"
        required
        fullWidth
        disabled={disabled}
        error={errosDatas.dataFim}
        value={dataFim}
        onChange={(e) => onDataFimChange(e.target.value)}
      />
      <Input
        label="Data de Realização"
        type="date"
        required
        fullWidth
        disabled={disabled}
        error={errosDatas.dataRealizacao}
        value={dataRealizacao}
        onChange={(e) => onDataRealizacaoChange(e.target.value)}
      />
    </Campos>
  </Cartao>
);

export default ConfiguracoesDatas;
