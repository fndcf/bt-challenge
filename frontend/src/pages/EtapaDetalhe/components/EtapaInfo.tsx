/**
 * Responsabilidade única: Card com informações gerais da etapa
 */

import React from "react";
import styled from "styled-components";
import { Rotulo, Texto } from "@/components/layout/Pagina";
import { SecaoPublica } from "@/components/torneio";
import { Badge } from "@/components/ui";
import { EtapaPublica } from "@/services/arenaPublicService";
import { theme } from "@/styles/theme";
import { getFormatoEtapaLabel } from "@/utils/etapa";
import { formatarData, getGeneroLabel, getNivelLabel } from "@/utils/formatters";

export interface EtapaInfoProps {
  etapa: EtapaPublica;
  totalJogadores: number;
}

const Dados = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: ${theme.spacing[4]};
`;

const Valor = styled.p`
  margin: 0;
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.semantic.texto.principal};
`;

const Descricao = styled(Texto)`
  margin-top: ${theme.spacing[4]};
`;

export const EtapaInfo: React.FC<EtapaInfoProps> = ({
  etapa,
  totalJogadores,
}) => {
  const dados: [string, string | undefined][] = [
    ["Data", formatarData(etapa.dataRealizacao)],
    ["Nível", etapa.nivel && getNivelLabel(etapa.nivel)],
    ["Gênero", etapa.genero && getGeneroLabel(etapa.genero)],
    ["Local", etapa.local],
    ["Jogadores", `${totalJogadores} inscritos`],
  ];

  return (
    <SecaoPublica
      titulo="Informações da Etapa"
      selo={
        <Badge formato={etapa.formato}>{getFormatoEtapaLabel(etapa)}</Badge>
      }
    >
      <Dados>
        {dados.map(
          ([rotulo, valor]) =>
            valor && (
              <div key={rotulo}>
                <Rotulo>{rotulo}</Rotulo>
                <Valor>{valor}</Valor>
              </div>
            )
        )}
      </Dados>

      {etapa.descricao && <Descricao>{etapa.descricao}</Descricao>}
    </SecaoPublica>
  );
};

export default EtapaInfo;
