/**
 * Responsabilidade única: Seletor de formato do torneio (Dupla Fixa, Rei da Praia, Super X ou TEAMS)
 */

import React from "react";
import { Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { OpcoesCartao } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";

export interface FormatoSelectorProps {
  formatoAtual: FormatoEtapa;
  onFormatoChange: (formato: FormatoEtapa) => void;
}

const OPCOES = [
  {
    valor: FormatoEtapa.DUPLA_FIXA,
    titulo: "Dupla Fixa",
    descricao: "Jogadores formam duplas antes do torneio",
  },
  {
    valor: FormatoEtapa.REI_DA_PRAIA,
    titulo: "Rei da Praia",
    descricao: "4 jogadores por grupo, duplas rotativas",
  },
  {
    valor: FormatoEtapa.SUPER_X,
    titulo: "Super X",
    descricao: "8 ou 12 jogadores, duplas rotativas, sem eliminatória",
  },
  {
    valor: FormatoEtapa.TEAMS,
    titulo: "TEAMS",
    descricao: "Equipes de 4 ou 6 jogadores, todos contra todos",
  },
].map((opcao) => ({ ...opcao, formato: opcao.valor }));

export const FormatoSelector: React.FC<FormatoSelectorProps> = ({
  formatoAtual,
  onFormatoChange,
}) => (
  <Cartao>
    <CartaoTitulo>Formato do Torneio</CartaoTitulo>
    <OpcoesCartao
      rotulo="Formato do Torneio"
      opcoes={OPCOES}
      valor={formatoAtual}
      onChange={onFormatoChange}
    />
  </Cartao>
);

export default FormatoSelector;
