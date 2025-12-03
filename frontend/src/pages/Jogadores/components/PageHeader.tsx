/**
 * PageHeader.tsx
 *
 * Responsabilidade única: Exibir cabeçalho da página com título e botão de ação
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import * as S from "../Jogadores.styles";

export interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();

  const handleNovoJogador = () => {
    navigate("/admin/jogadores/novo");
  };

  return (
    <S.Header>
      <S.HeaderInfo>
        <S.Title>{title}</S.Title>
        <S.Subtitle>{subtitle}</S.Subtitle>
      </S.HeaderInfo>
      <S.NewButton onClick={handleNovoJogador}>Novo Jogador</S.NewButton>
    </S.Header>
  );
};

export default PageHeader;
