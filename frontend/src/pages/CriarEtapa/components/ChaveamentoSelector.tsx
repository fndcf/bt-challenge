/**
 * Responsabilidade única: Seletor de tipo de chaveamento para Rei da Praia
 */

import React from "react";
import { Cartao, CartaoTitulo, Texto } from "@/components/layout/Pagina";
import { OpcoesCartao } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { getChaveamentoLabel } from "@/utils/etapa";

export interface ChaveamentoSelectorProps {
  tipoChaveamento: TipoChaveamentoReiDaPraia;
  onTipoChange: (tipo: TipoChaveamentoReiDaPraia) => void;
}

const DESCRICAO: Record<TipoChaveamentoReiDaPraia, string> = {
  [TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES]:
    "Duplas extremas: 1º+2º vs 3º+4º",
  [TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING]:
    "Duplas equilibradas: 1º lugar + 2º lugar",
  [TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO]:
    "Sorteio protegido entre classificados",
};

const OPCOES = Object.values(TipoChaveamentoReiDaPraia).map((tipo) => ({
  valor: tipo,
  titulo: getChaveamentoLabel(tipo),
  descricao: DESCRICAO[tipo],
  formato: FormatoEtapa.REI_DA_PRAIA,
}));

export const ChaveamentoSelector: React.FC<ChaveamentoSelectorProps> = ({
  tipoChaveamento,
  onTipoChange,
}) => (
  <Cartao>
    <div>
      <CartaoTitulo>Chaveamento da Fase Eliminatória</CartaoTitulo>
      <Texto>Como as duplas serão formadas na fase eliminatória</Texto>
    </div>
    <OpcoesCartao
      rotulo="Chaveamento da Fase Eliminatória"
      opcoes={OPCOES}
      valor={tipoChaveamento}
      onChange={onTipoChange}
    />
  </Cartao>
);

export default ChaveamentoSelector;
