/**
 * Cartão da etapa na listagem
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { StatusBadge } from "../StatusBadge";
import { Badge, BarraProgresso, Button } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Etapa, FormatoEtapa, StatusEtapa } from "@/types/etapa";
import {
  getChaveamentoLabel,
  getFormacaoEquipeLabel,
  getFormatoEtapaLabel,
  getQtdGrupos,
} from "@/utils/etapa";
import { formatarData, getGeneroLabel, getNivelLabel } from "@/utils/formatters";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface EtapaCardProps {
  etapa: Etapa;
}

// ============== STYLED COMPONENTS ==============

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  cursor: pointer;

  &:hover {
    border-color: ${acao.primaria};
  }
`;

// h2: vem logo abaixo do h1 da página (ordem dos títulos)
const Titulo = styled.h2`
  margin: 0 0 ${theme.spacing[2]} 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
`;

const Descricao = styled.p`
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Dados = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${theme.spacing[3]} ${theme.spacing[4]};
`;

const Rotulo = styled.p`
  margin: 0;
  font-size: ${fontSize.xs};
  color: ${texto.secundario};
`;

const Valor = styled.p`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Inscritos = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing[2]};
`;

const Rodape = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]} ${theme.spacing[4]};
  margin-top: auto;
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${superficie.borda};
  font-size: ${fontSize.xs};
  color: ${texto.secundario};
`;

const Grupo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]} ${theme.spacing[3]};
`;

// ============== HELPERS ==============

const rotuloGrupos = (etapa: Etapa): string => {
  const total = getQtdGrupos(etapa);
  return `${total} ${total === 1 ? "grupo" : "grupos"}`;
};

/** Textos do rodapé (grupos, equipes, rodadas) conforme o formato */
const getEstrutura = (etapa: Etapa): string[] => {
  switch (etapa.formato) {
    case FormatoEtapa.SUPER_X:
      return [
        "1 grupo único",
        etapa.varianteSuperX === 8 ? "7 rodadas" : "11 rodadas",
      ];
    case FormatoEtapa.TEAMS: {
      const porEquipe = etapa.varianteTeams || 4;
      return [
        `${Math.floor(etapa.totalInscritos / porEquipe)} equipes`,
        `${porEquipe} jogadores/equipe`,
      ];
    }
    case FormatoEtapa.REI_DA_PRAIA:
      return [rotuloGrupos(etapa), "4 jogadores/grupo"];
    default:
      return [
        rotuloGrupos(etapa),
        etapa.grupoUnico ? "Todos contra todos" : "3 ou 4 duplas/grupo",
      ];
  }
};

const getAcaoLabel = (etapa: Etapa): string | null => {
  switch (etapa.status) {
    case StatusEtapa.INSCRICOES_ABERTAS:
    case StatusEtapa.INSCRICOES_ENCERRADAS:
    case StatusEtapa.FINALIZADA:
      return "Ver detalhes →";
    case StatusEtapa.CHAVES_GERADAS:
      return etapa.formato === FormatoEtapa.REI_DA_PRAIA ||
        etapa.formato === FormatoEtapa.TEAMS
        ? "Ver grupos →"
        : "Ver chaves →";
    case StatusEtapa.FASE_ELIMINATORIA:
      return "Ver eliminatória →";
    default:
      return null;
  }
};

// ============== COMPONENTE ==============

export const EtapaCard: React.FC<EtapaCardProps> = ({ etapa }) => {
  const navigate = useNavigate();

  const abrir = () => navigate(`/admin/etapas/${etapa.id}`);

  const progresso =
    etapa.maxJogadores === 0
      ? 0
      : Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100);

  const acaoLabel = getAcaoLabel(etapa);

  const dados: [string, string | false | undefined][] = [
    ["Realização", formatarData(etapa.dataRealizacao)],
    [
      "Chaveamento",
      etapa.formato === FormatoEtapa.REI_DA_PRAIA &&
        !!etapa.tipoChaveamento &&
        getChaveamentoLabel(etapa.tipoChaveamento, "curto"),
    ],
    [
      "Formação Equipes",
      etapa.formato === FormatoEtapa.TEAMS &&
        !!etapa.tipoFormacaoEquipe &&
        getFormacaoEquipeLabel(etapa.tipoFormacaoEquipe),
    ],
    ["Nível", !!etapa.nivel && getNivelLabel(etapa.nivel)],
    ["Gênero", getGeneroLabel(etapa.genero)],
    ["Local", etapa.local],
  ];

  return (
    <Card onClick={abrir}>
      <div>
        <Titulo>{etapa.nome}</Titulo>
        <Selos>
          <StatusBadge status={etapa.status} />
          <Badge formato={etapa.formato}>{getFormatoEtapaLabel(etapa)}</Badge>
        </Selos>
      </div>

      {etapa.descricao && <Descricao>{etapa.descricao}</Descricao>}

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

      <div>
        <Inscritos>
          <Rotulo>Inscritos</Rotulo>
          <Valor>
            {etapa.totalInscritos} / {etapa.maxJogadores}
          </Valor>
        </Inscritos>
        <BarraProgresso valor={progresso} rotulo="Vagas preenchidas" />
      </div>

      <Rodape>
        <Grupo>
          {getEstrutura(etapa).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </Grupo>
        <Grupo>
          {etapa.status === StatusEtapa.FINALIZADA && (
            <Badge tom="sucesso">Concluída</Badge>
          )}
          {acaoLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                abrir();
              }}
            >
              {acaoLabel}
            </Button>
          )}
        </Grupo>
      </Rodape>
    </Card>
  );
};

export default EtapaCard;
