/**
 * Responsabilidade única: Exibir grid de ações rápidas
 */

import React from "react";
import { Grade } from "@/components/layout/Pagina";
import * as S from "../Dashboard.styles";

export interface QuickActionsProps {
  arenaSlug?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ arenaSlug }) => {
  const acoes = [
    {
      label: "Cadastrar Jogador",
      description: "Adicione novos jogadores à arena",
      link: "/admin/jogadores/novo",
    },
    {
      label: "Criar Etapa",
      description: "Inicie uma nova etapa de torneio",
      link: "/admin/etapas/criar",
    },
    {
      label: "Página Pública",
      description: "Link público para jogadores",
      link: `/arena/${arenaSlug || ""}`,
    },
  ];

  return (
    <Grade>
      {acoes.map((acao) => (
        <S.ActionCard key={acao.label} to={acao.link}>
          <div>
            <h3>{acao.label}</h3>
            <p>{acao.description}</p>
          </div>
          <span aria-hidden="true">→</span>
        </S.ActionCard>
      ))}
    </Grade>
  );
};

export default QuickActions;
