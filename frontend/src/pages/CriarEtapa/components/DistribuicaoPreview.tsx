/**
 * Responsabilidade única: Preview da distribuição de grupos baseado no formato
 */

import React from "react";
import { Alert } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { getChaveamentoLabel } from "@/utils/etapa";
import {
  DistribuicaoDuplaFixa,
  DistribuicaoReiDaPraia,
  DistribuicaoSuperX,
  DistribuicaoTeams,
} from "../hooks/useCriarEtapa";

export interface DistribuicaoPreviewProps {
  formato: FormatoEtapa;
  tipoChaveamento: TipoChaveamentoReiDaPraia;
  infoDuplaFixa: DistribuicaoDuplaFixa;
  infoReiDaPraia: DistribuicaoReiDaPraia;
  infoSuperX?: DistribuicaoSuperX;
  infoTeams?: DistribuicaoTeams;
}

interface Preview {
  titulo: string;
  valido: boolean;
  /** De onde para onde (ex.: "16 jogadores" → "4 grupos") */
  de: [numero: number, nome: string];
  para: [numero: number, nome: string];
  descricao: string;
  notas: string[];
}

const plural = (
  quantidade: number,
  singular: string
): [numero: number, nome: string] => [
  quantidade,
  quantidade === 1 ? singular : `${singular}s`,
];

const montarPreview = ({
  formato,
  tipoChaveamento,
  infoDuplaFixa,
  infoReiDaPraia,
  infoSuperX,
  infoTeams,
}: DistribuicaoPreviewProps): Preview => {
  if (formato === FormatoEtapa.SUPER_X && infoSuperX) {
    return {
      titulo: `Distribuição Super ${infoSuperX.variante}`,
      valido: true,
      de: [infoSuperX.totalJogadores, "jogadores"],
      para: [1, "grupo único"],
      descricao: infoSuperX.descricao,
      notas: [
        "Duplas rotativas a cada rodada - todos jogam com todos",
        "Sem fase eliminatória - classificação final individual",
      ],
    };
  }

  if (formato === FormatoEtapa.TEAMS && infoTeams) {
    return {
      titulo: `Distribuição Teams ${infoTeams.variante}`,
      valido: infoTeams.valido,
      de: [infoTeams.totalJogadores, "jogadores"],
      para: plural(infoTeams.totalEquipes, "equipe"),
      descricao: infoTeams.descricao,
      notas: [
        `${infoTeams.jogadoresPorEquipe} jogadores por equipe`,
        `${infoTeams.jogosPorConfronto} jogos por confronto${
          infoTeams.variante === 4 ? " (+ decider se 1-1)" : ""
        }`,
        infoTeams.grupos.length > 1
          ? "Todos contra todos dentro do grupo - vitória no confronto = 3 pontos"
          : "Todos contra todos - vitória no confronto = 3 pontos",
      ],
    };
  }

  if (formato === FormatoEtapa.REI_DA_PRAIA) {
    return {
      titulo: "Distribuição Rei da Praia",
      valido: infoReiDaPraia.valido,
      de: [infoReiDaPraia.totalJogadores, "jogadores"],
      para: plural(infoReiDaPraia.qtdGrupos, "grupo"),
      descricao: infoReiDaPraia.descricao,
      notas: [
        "Cada grupo: 4 jogadores, 3 partidas",
        `Chaveamento: ${getChaveamentoLabel(tipoChaveamento)}`,
      ],
    };
  }

  return {
    titulo: "Distribuição de Grupos",
    valido: infoDuplaFixa.valido,
    de: [infoDuplaFixa.totalDuplas, "duplas"],
    para: plural(infoDuplaFixa.qtdGrupos, "grupo"),
    descricao: infoDuplaFixa.descricao,
    notas: [
      infoDuplaFixa.qtdGrupos === 1
        ? "Todas as duplas jogam entre si"
        : "Grupos com 3 duplas cada (mínimo)",
    ],
  };
};

export const DistribuicaoPreview: React.FC<DistribuicaoPreviewProps> = (
  props
) => {
  const { titulo, valido, de, para, descricao, notas } = montarPreview(props);

  if (!valido) {
    return (
      <Alert variant="warning" title={titulo}>
        {descricao}
      </Alert>
    );
  }

  return (
    <Alert title={titulo}>
      <p>
        <strong>{de[0]}</strong> {de[1]} → <strong>{para[0]}</strong> {para[1]}
      </p>
      <p>{descricao}</p>
      <ul>
        {notas.map((nota) => (
          <li key={nota}>{nota}</li>
        ))}
      </ul>
    </Alert>
  );
};

export default DistribuicaoPreview;
