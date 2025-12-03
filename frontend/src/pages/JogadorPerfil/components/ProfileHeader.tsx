/**
 * ProfileHeader.tsx
 *
 * Responsabilidade única: Cabeçalho do perfil com avatar, nome, badges e posição
 */

import React from "react";
import * as S from "../JogadorPerfil.styles";

export interface ProfileHeaderProps {
  nomeJogador: string;
  arenaNome: string;
  nivelJogador?: string;
  generoJogador?: string;
  posicaoAtual: number;
  getInitials: (nome: string) => string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  nomeJogador,
  arenaNome,
  nivelJogador,
  generoJogador,
  posicaoAtual,
  getInitials,
}) => {
  return (
    <S.ProfileHeader>
      <S.Avatar>{getInitials(nomeJogador)}</S.Avatar>
      <S.ProfileInfo>
        <h1>{nomeJogador}</h1>
        <p>Jogador da {arenaNome}</p>

        {/* Badges de nível e gênero */}
        <S.BadgeGroup>
          {nivelJogador && (
            <S.NivelTag $nivel={nivelJogador} $genero={generoJogador}>
              {nivelJogador}
            </S.NivelTag>
          )}
          {generoJogador && (
            <S.GeneroTag $genero={generoJogador}>{generoJogador}</S.GeneroTag>
          )}
        </S.BadgeGroup>
      </S.ProfileInfo>

      {/* Melhor Posição */}
      <S.StatCard>
        <S.StatValue>{posicaoAtual > 0 ? `${posicaoAtual}º` : "-"}</S.StatValue>
        <S.StatLabel>Posição no Ranking</S.StatLabel>
      </S.StatCard>
    </S.ProfileHeader>
  );
};

export default ProfileHeader;
