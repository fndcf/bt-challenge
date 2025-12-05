/**
 * Responsabilidade única: Renderizar cabeçalho da página de listagem
 */

import React from "react";
import * as S from "../ListagemEtapas.styles";

interface PageHeaderProps {
  onCriarClick: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ onCriarClick }) => {
  return (
    <S.Header>
      <S.HeaderContent>
        <S.Title>Etapas</S.Title>
        <S.Subtitle>Gerencie as etapas do torneio</S.Subtitle>
      </S.HeaderContent>
      <S.CreateButton onClick={onCriarClick}>Criar Etapa</S.CreateButton>
    </S.Header>
  );
};

export default PageHeader;
