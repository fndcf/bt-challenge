/**
 * Responsabilidade única: Renderizar cards de informações da etapa
 */

import React from "react";
import styled from "styled-components";
import { Badge, BarraProgresso } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Etapa } from "@/types/etapa";
import {
  calcularGruposTeams,
  getChaveamentoLabel,
  getFormacaoEquipeLabel,
  getFormatoEtapaLabel,
} from "@/utils/etapa";
import { formatarData, getGeneroLabel, getNivelLabel } from "@/utils/formatters";
import { Cartao, CartaoTitulo, Texto } from "../DetalhesEtapa.styles";

const { texto } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface EtapaInfoCardsProps {
  etapa: Etapa;
  progresso: number;
  isReiDaPraia: boolean;
  isSuperX?: boolean;
  isTeams?: boolean;
}

const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: ${theme.spacing[4]};
`;

const Rotulo = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Numero = styled.p`
  margin: 0;
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Itens = styled.ul`
  margin: 0;
  padding-left: ${theme.spacing[4]};
  font-size: ${fontSize.sm};
  line-height: 1.7;
  color: ${texto.secundario};
`;

const Dados = styled.dl`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  margin: 0;
  font-size: ${fontSize.sm};

  div {
    display: flex;
    justify-content: space-between;
    gap: ${theme.spacing[4]};
  }

  dt {
    color: ${texto.secundario};
  }

  dd {
    margin: 0;
    font-weight: ${fontWeight.semibold};
    color: ${texto.principal};
    text-align: right;
  }
`;

type Dado = [rotulo: string, valor: React.ReactNode];

const ListaDados: React.FC<{ dados: (Dado | false | undefined | "")[] }> = ({
  dados,
}) => (
  <Dados>
    {dados.map(
      (dado) =>
        dado && (
          <div key={dado[0]}>
            <dt>{dado[0]}</dt>
            <dd>{dado[1]}</dd>
          </div>
        )
    )}
  </Dados>
);

export const EtapaInfoCards: React.FC<EtapaInfoCardsProps> = ({
  etapa,
  progresso,
  isReiDaPraia,
  isSuperX = false,
  isTeams = false,
}) => {
  const jogadoresPorEquipe = etapa.varianteTeams || 4;
  const numEquipes = Math.floor(etapa.totalInscritos / jogadoresPorEquipe);
  const gruposTeams = calcularGruposTeams(numEquipes);

  const getEstrutura = (): {
    rotulo: string;
    total: number;
    itens: string[];
  } => {
    if (isTeams) {
      return {
        rotulo: "Equipes",
        total: numEquipes,
        itens: [
          `${jogadoresPorEquipe} jogadores por equipe`,
          `${jogadoresPorEquipe === 4 ? 2 : 3} jogos por confronto`,
          gruposTeams > 1
            ? `${gruposTeams} grupos + eliminatórias`
            : "Todos contra todos",
        ],
      };
    }
    if (isSuperX) {
      const variante = etapa.varianteSuperX || 8;
      return {
        rotulo: "Grupo Único",
        total: 1,
        itens: [
          `${variante} jogadores`,
          `${variante === 8 ? 7 : 11} rodadas`,
          "Duplas rotativas",
        ],
      };
    }
    if (isReiDaPraia) {
      return {
        rotulo: "Grupos de 4",
        total: etapa.qtdGrupos || 0,
        itens: ["4 jogadores por grupo", "3 partidas por grupo"],
      };
    }
    return {
      rotulo: "Grupos",
      total: etapa.qtdGrupos || 0,
      itens: [`${etapa.jogadoresPorGrupo} duplas por grupo`],
    };
  };

  const estrutura = getEstrutura();
  const alvo = isTeams ? "Equipes" : "Chaves";

  return (
    <>
      <Grade>
        <Cartao>
          <div>
            <Rotulo>Inscritos</Rotulo>
            <Numero>
              {etapa.totalInscritos} / {etapa.maxJogadores}
            </Numero>
          </div>
          <BarraProgresso valor={progresso} rotulo="Vagas preenchidas" />
          <Rotulo>{progresso}% preenchido</Rotulo>
        </Cartao>

        <Cartao>
          <div>
            <Rotulo>{estrutura.rotulo}</Rotulo>
            <Numero>{estrutura.total}</Numero>
          </div>
          <Itens>
            {estrutura.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </Itens>
          <div>
            <Badge tom={etapa.chavesGeradas ? "sucesso" : "neutro"}>
              {etapa.chavesGeradas
                ? `✓ ${alvo} geradas`
                : `${alvo} não geradas`}
            </Badge>
          </div>
        </Cartao>

        <Cartao>
          <div>
            <Rotulo>Realização</Rotulo>
            <Numero>{formatarData(etapa.dataRealizacao)}</Numero>
          </div>
          <ListaDados
            dados={[
              etapa.local && ["Local", etapa.local],
              ["Formato", getFormatoEtapaLabel(etapa)],
              ["Gênero", getGeneroLabel(etapa.genero)],
              etapa.nivel && ["Nível", getNivelLabel(etapa.nivel)],
              isReiDaPraia &&
                etapa.tipoChaveamento && [
                  "Chaveamento",
                  getChaveamentoLabel(etapa.tipoChaveamento),
                ],
              isTeams &&
                etapa.tipoFormacaoEquipe && [
                  "Formação Equipes",
                  getFormacaoEquipeLabel(etapa.tipoFormacaoEquipe),
                ],
            ]}
          />
        </Cartao>
      </Grade>

      <Grade>
        <Cartao>
          <CartaoTitulo>Datas Importantes</CartaoTitulo>
          <ListaDados
            dados={[
              ["Início das inscrições", formatarData(etapa.dataInicio)],
              ["Fim das inscrições", formatarData(etapa.dataFim)],
              ["Data de realização", formatarData(etapa.dataRealizacao)],
            ]}
          />
        </Cartao>

        <Cartao>
          <CartaoTitulo>Estatísticas</CartaoTitulo>
          <ListaDados
            dados={[
              ["Total de inscritos", etapa.totalInscritos],
              ["Vagas disponíveis", etapa.maxJogadores - etapa.totalInscritos],
              ["Taxa de ocupação", `${progresso}%`],
            ]}
          />
        </Cartao>
      </Grade>

      {etapa.descricao && (
        <Cartao>
          <CartaoTitulo>Descrição</CartaoTitulo>
          <Texto>{etapa.descricao}</Texto>
        </Cartao>
      )}
    </>
  );
};

export default EtapaInfoCards;
