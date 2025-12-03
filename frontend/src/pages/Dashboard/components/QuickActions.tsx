/**
 * QuickActions.tsx
 *
 * Responsabilidade única: Exibir grid de ações rápidas
 */

import React from "react";
import * as S from "../Dashboard.styles";

export interface QuickActionsProps {
  arenaSlug?: string;
}

interface Action {
  label: string;
  description: string;
  link: string;
  color: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ arenaSlug }) => {
  const actions: Action[] = [
    {
      label: "Cadastrar Jogador",
      description: "Adicione novos jogadores à arena",
      link: "/admin/jogadores/novo",
      color: "#134e5e",
    },
    {
      label: "Criar Challenge",
      description: "Inicie uma nova etapa de torneio",
      link: "/admin/etapas/criar",
      color: "#f093fb",
    },
    {
      label: "Página Pública",
      description: "Link público para jogadores",
      link: `/arena/${arenaSlug || ""}`,
      color: "#4facfe",
    },
  ];

  return (
    <S.ActionsGrid>
      {actions.map((action, index) => (
        <S.ActionCard key={index} to={action.link}>
          <S.ActionContent>
            <h3>{action.label}</h3>
            <p>{action.description}</p>
          </S.ActionContent>
          <S.ActionArrow $color={action.color}>→</S.ActionArrow>
        </S.ActionCard>
      ))}
    </S.ActionsGrid>
  );
};

export default QuickActions;
