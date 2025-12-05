/**
 * Responsabilidade única: Exibir banner de boas-vindas (apenas desktop)
 */

import React from "react";
import * as S from "../Dashboard.styles";

export interface WelcomeBannerProps {
  userName: string;
  arenaName?: string;
  arenaSlug?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName,
  arenaName,
  arenaSlug,
}) => {
  return (
    <S.WelcomeBanner>
      <S.WelcomeText>
        <h1>Bem-vindo(a), {userName}!</h1>
        <p>Gerencie sua arena e organize torneios incríveis</p>
      </S.WelcomeText>
      {arenaName && arenaSlug && (
        <S.ArenaBadge>
          <div>
            <p>{arenaName}</p>
            <small>/{arenaSlug}</small>
          </div>
        </S.ArenaBadge>
      )}
    </S.WelcomeBanner>
  );
};

export default WelcomeBanner;
