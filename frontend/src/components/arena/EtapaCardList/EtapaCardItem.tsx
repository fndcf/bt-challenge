/**
 * Responsabilidade única: Renderizar um card individual de etapa
 */

import React from "react";
import styled from "styled-components";
import { StatusBadge } from "@/components/etapas/StatusBadge";
import { Cartao, CartaoTitulo, Texto } from "@/components/layout/Pagina";
import { Badge, ButtonLink } from "@/components/ui";
import { EtapaPublica } from "@/services/arenaPublicService";
import { theme } from "@/styles/theme";
import { getFormatoEtapaLabel } from "@/utils/etapa";
import { formatarData, getGeneroLabel, getNivelLabel } from "@/utils/formatters";

interface EtapaCardItemProps {
  etapa: EtapaPublica;
  arenaSlug: string;
}

const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
`;

const Dados = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};

  strong {
    color: ${theme.semantic.texto.principal};
  }
`;

const Rodape = styled.div`
  margin-top: auto;
`;

export const EtapaCardItem: React.FC<EtapaCardItemProps> = ({
  etapa,
  arenaSlug,
}) => (
  <Cartao>
    <Selos>
      <StatusBadge status={etapa.status} />
      <Badge formato={etapa.formato}>{getFormatoEtapaLabel(etapa)}</Badge>
    </Selos>

    <CartaoTitulo as="h3">{etapa.nome}</CartaoTitulo>

    <Dados>
      <Texto>
        <strong>Data:</strong> {formatarData(etapa.dataRealizacao)}
      </Texto>
      {etapa.nivel && (
        <Texto>
          <strong>Nível:</strong> <span>{getNivelLabel(etapa.nivel)}</span>
        </Texto>
      )}
      {etapa.genero && (
        <Texto>
          <strong>Gênero:</strong> <span>{getGeneroLabel(etapa.genero)}</span>
        </Texto>
      )}
      {etapa.local && (
        <Texto>
          <strong>Local:</strong> <span>{etapa.local}</span>
        </Texto>
      )}
      <Texto>
        <strong>Jogadores:</strong>{" "}
        <span>{`${etapa.totalInscritos} / ${etapa.maxJogadores}`}</span>
      </Texto>
    </Dados>

    {etapa.descricao && <Texto>{etapa.descricao}</Texto>}

    <Rodape>
      <ButtonLink fullWidth to={`/arena/${arenaSlug}/etapa/${etapa.id}`}>
        Ver Detalhes
      </ButtonLink>
    </Rodape>
  </Cartao>
);

export default EtapaCardItem;
