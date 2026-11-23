/**
 * Responsabilidade única: Formato da etapa (não muda depois de criada) e,
 * no Rei da Praia, o tipo de chaveamento da eliminatória.
 * Variante e formação ficam em "Configurações" (ConfiguracoesJogadoresEdit).
 */

import React from "react";
import { Cartao, CartaoTitulo, Rotulo } from "@/components/layout/Pagina";
import { Badge, Select } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { getCoresFormato } from "@/styles/semantic";
import { getChaveamentoLabel } from "@/utils/etapa";

export interface FormatoDisplayProps {
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  chavesGeradas: boolean;
  onTipoChaveamentoChange: (tipo: TipoChaveamentoReiDaPraia) => void;
}

const CHAVEAMENTOS = Object.values(TipoChaveamentoReiDaPraia).map((tipo) => ({
  value: tipo,
  label: getChaveamentoLabel(tipo),
}));

export const FormatoDisplay: React.FC<FormatoDisplayProps> = ({
  formato,
  tipoChaveamento,
  chavesGeradas,
  onTipoChaveamentoChange,
}) => (
  <Cartao>
    <CartaoTitulo>Formato</CartaoTitulo>
    <div>
      <Rotulo>Formato da etapa</Rotulo>
      <Badge formato={formato}>{getCoresFormato(formato).nome}</Badge>
    </div>

    {formato === FormatoEtapa.REI_DA_PRAIA && (
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
  </Cartao>
);

export default FormatoDisplay;
