/**
 * Um grupo (ou fase) na página pública: classificação, equipes e partidas
 */

import React from "react";
import styled from "styled-components";
import {
  GrupoPainel,
  ListaConfrontos,
  TabelaClassificacao,
} from "@/components/torneio";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";
import { COLUNAS_PUBLICO, COLUNAS_PUBLICO_TEAMS } from "@/utils/classificacao";
import { montarTabela } from "../gruposHelpers";
import { Grupo } from "../types";
import { ConfrontoPublico, PartidaPublica } from "./PartidasPublicas";

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
`;

const Subtitulo = styled.h4`
  margin: ${theme.spacing[2]} 0 0 0;
  font-size: ${fontSize.base};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Equipes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
  gap: ${theme.spacing[3]};
`;

const Equipe = styled.div`
  padding: ${theme.spacing[3]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundoAlternativo};

  h5 {
    margin: 0 0 ${theme.spacing[2]} 0;
    font-size: ${fontSize.sm};
    font-weight: ${fontWeight.bold};
    color: ${texto.principal};
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: ${fontSize.sm};
    line-height: 1.6;
    color: ${texto.secundario};
  }
`;

interface GrupoPublicoProps {
  grupo: Grupo;
  formato: FormatoEtapa;
}

export const GrupoPublico: React.FC<GrupoPublicoProps> = ({
  grupo,
  formato,
}) => {
  const isTeams = formato === FormatoEtapa.TEAMS;
  const tabela = montarTabela(grupo, formato);
  const equipes = isTeams ? grupo.equipes ?? [] : [];
  const confrontos = isTeams ? grupo.confrontos ?? [] : [];
  const partidas = isTeams ? [] : grupo.partidas ?? [];
  const temConteudo =
    equipes.length + confrontos.length + partidas.length > 0;

  return (
    <GrupoPainel formato={formato} nome={grupo.nome}>
      {tabela && (
        <TabelaClassificacao
          formato={formato}
          legenda={`Classificação: ${grupo.nome}`}
          rotuloNome={tabela.rotulo}
          colunas={isTeams ? COLUNAS_PUBLICO_TEAMS : COLUNAS_PUBLICO}
          linhas={tabela.linhas}
        />
      )}

      {temConteudo && (
        <Conteudo>
          {equipes.length > 0 && (
            <>
              <Subtitulo>Equipes</Subtitulo>
              <Equipes>
                {equipes.map((equipe) => (
                  <Equipe key={equipe.id}>
                    <h5>{equipe.nome}</h5>
                    {!!equipe.jogadores?.length && (
                      <ul>
                        {equipe.jogadores.map((jogador) => (
                          <li key={jogador.id}>{jogador.nome}</li>
                        ))}
                      </ul>
                    )}
                  </Equipe>
                ))}
              </Equipes>
            </>
          )}

          {confrontos.length > 0 && (
            <>
              {/* Na eliminatória o nome da fase já está no cabeçalho */}
              {grupo.tipo !== "eliminatoria" && (
                <Subtitulo>Confrontos</Subtitulo>
              )}
              <ListaConfrontos>
                {confrontos.map((confronto) => (
                  <ConfrontoPublico key={confronto.id} confronto={confronto} />
                ))}
              </ListaConfrontos>
            </>
          )}

          {partidas.length > 0 && (
            <>
              <Subtitulo>Partidas</Subtitulo>
              <ListaConfrontos>
                {partidas.map((partida) => (
                  <PartidaPublica key={partida.id} partida={partida} />
                ))}
              </ListaConfrontos>
            </>
          )}
        </Conteudo>
      )}
    </GrupoPainel>
  );
};
