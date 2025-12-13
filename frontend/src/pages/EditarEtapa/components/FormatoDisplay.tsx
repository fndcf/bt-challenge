/**
 * Responsabilidade única: Exibir formato da etapa (read-only) e permitir edição de chaveamento
 */

import React from "react";
import {
  FormatoEtapa,
  VarianteTeams,
  TipoFormacaoEquipe,
  TipoFormacaoJogos
} from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import * as S from "../EditarEtapa.styles";

export interface FormatoDisplayProps {
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  chavesGeradas: boolean;
  onTipoChaveamentoChange: (tipo: TipoChaveamentoReiDaPraia) => void;
  // TEAMS props
  varianteTeams?: VarianteTeams;
  tipoFormacaoEquipe?: TipoFormacaoEquipe;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  onTipoFormacaoJogosChange?: (tipo: TipoFormacaoJogos) => void;
}

const getFormatoLabel = (formato: FormatoEtapa): string => {
  switch (formato) {
    case FormatoEtapa.DUPLA_FIXA:
      return "Dupla Fixa";
    case FormatoEtapa.REI_DA_PRAIA:
      return "Rei da Praia";
    case FormatoEtapa.SUPER_X:
      return "Super X";
    case FormatoEtapa.TEAMS:
      return "TEAMS";
    default:
      return "Desconhecido";
  }
};

const getTipoFormacaoEquipeLabel = (tipo?: TipoFormacaoEquipe): string => {
  switch (tipo) {
    case TipoFormacaoEquipe.MESMO_NIVEL:
      return "Mesmo Nível";
    case TipoFormacaoEquipe.BALANCEADO:
      return "Balanceado";
    case TipoFormacaoEquipe.MANUAL:
      return "Manual";
    default:
      return "Não definido";
  }
};

const getTipoFormacaoJogosLabel = (tipo?: TipoFormacaoJogos): string => {
  switch (tipo) {
    case TipoFormacaoJogos.SORTEIO:
      return "Sorteio Aleatório";
    case TipoFormacaoJogos.MANUAL:
      return "Manual";
    default:
      return "Não definido";
  }
};

export const FormatoDisplay: React.FC<FormatoDisplayProps> = ({
  formato,
  tipoChaveamento,
  chavesGeradas,
  onTipoChaveamentoChange,
  varianteTeams,
  tipoFormacaoEquipe,
  tipoFormacaoJogos,
  onTipoFormacaoJogosChange,
}) => {
  const isReiDaPraia = formato === FormatoEtapa.REI_DA_PRAIA;
  const isTeams = formato === FormatoEtapa.TEAMS;

  return (
    <>
      <S.GridContainer2>
        {/* Card de Formato (Read-only) */}
        <S.InfoCard>
          <S.InfoContent>
            <S.InfoLabel>Formato</S.InfoLabel>
            <S.InfoValue>{getFormatoLabel(formato)}</S.InfoValue>
          </S.InfoContent>
        </S.InfoCard>

        {/* Chaveamento - Editável até gerar eliminatória (REI DA PRAIA) */}
        {isReiDaPraia && (
          <S.Field>
            <S.Label>
              Tipo de Chaveamento <S.Required>*</S.Required>
            </S.Label>
            <S.Select
              required
              disabled={chavesGeradas}
              value={tipoChaveamento || ""}
              onChange={(e) =>
                onTipoChaveamentoChange(
                  e.target.value as TipoChaveamentoReiDaPraia
                )
              }
            >
              <option value={TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES}>
                Melhores com Melhores
              </option>
              <option value={TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING}>
                Pareamento por Ranking
              </option>
              <option value={TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO}>
                Sorteio Aleatório
              </option>
            </S.Select>
            <S.HelperText>
              Define como as duplas serão formadas na fase eliminatória
            </S.HelperText>
          </S.Field>
        )}

        {/* Variante TEAMS - Read-only */}
        {isTeams && (
          <S.InfoCard>
            <S.InfoContent>
              <S.InfoLabel>Variante TEAMS</S.InfoLabel>
              <S.InfoValue>TEAMS {varianteTeams}</S.InfoValue>
            </S.InfoContent>
          </S.InfoCard>
        )}
      </S.GridContainer2>

      {/* Segunda linha com campos do TEAMS */}
      {isTeams && (
        <S.GridContainer2>
          {/* Tipo de Formação de Equipes - Read-only */}
          <S.InfoCard>
            <S.InfoContent>
              <S.InfoLabel>Tipo de Formação de Equipes</S.InfoLabel>
              <S.InfoValue>{getTipoFormacaoEquipeLabel(tipoFormacaoEquipe)}</S.InfoValue>
            </S.InfoContent>
          </S.InfoCard>

          {/* Formação das Partidas - Editável */}
          <S.Field>
            <S.Label>
              Formação das Partidas <S.Required>*</S.Required>
            </S.Label>
            <S.Select
              required
              disabled={chavesGeradas}
              value={tipoFormacaoJogos || ""}
              onChange={(e) =>
                onTipoFormacaoJogosChange?.(e.target.value as TipoFormacaoJogos)
              }
            >
              <option value={TipoFormacaoJogos.SORTEIO}>
                {getTipoFormacaoJogosLabel(TipoFormacaoJogos.SORTEIO)}
              </option>
              <option value={TipoFormacaoJogos.MANUAL}>
                {getTipoFormacaoJogosLabel(TipoFormacaoJogos.MANUAL)}
              </option>
            </S.Select>
            <S.HelperText>
              Define como os jogadores serão distribuídos nas partidas de cada confronto
            </S.HelperText>
          </S.Field>
        </S.GridContainer2>
      )}
    </>
  );
};

export default FormatoDisplay;
