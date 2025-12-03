/**
 * PageHeader.tsx
 *
 * Responsabilidade única: Cabeçalho da página com breadcrumb e botão voltar
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import * as S from "../JogadorPerfil.styles";

export interface PageHeaderProps {
  arenaSlug: string;
  arenaNome: string;
  jogadorNome: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  arenaSlug,
  arenaNome,
  jogadorNome,
}) => {
  const navigate = useNavigate();

  return (
    <S.Header>
      <S.HeaderInfo>
        <S.BackButton onClick={() => navigate(-1)}>← Voltar</S.BackButton>
      </S.HeaderInfo>
      <S.HeaderContent>
        <S.Breadcrumb>
          <Link to={`/arena/${arenaSlug}`}>{arenaNome}</Link>
          <span>›</span>
          <span>{jogadorNome}</span>
        </S.Breadcrumb>
      </S.HeaderContent>
    </S.Header>
  );
};

export default PageHeader;
