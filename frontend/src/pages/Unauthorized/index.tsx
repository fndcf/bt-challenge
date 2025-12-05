/**
 * Responsabilidade única: Página 403 - Acesso não autorizado
 */

import React from "react";
import { Home, ShieldAlert } from "lucide-react";
import { useDocumentTitle } from "@/hooks";
import * as S from "./Unauthorized.styles";

export const Unauthorized: React.FC = () => {
  useDocumentTitle("Acesso Negado");

  return (
    <S.PageContainer>
      <S.ContentContainer>
        <S.LockIcon>
          <ShieldAlert size={50} />
        </S.LockIcon>

        <S.ErrorCode>403</S.ErrorCode>
        <S.Title>Acesso Negado</S.Title>
        <S.Description>
          Você não tem permissão para acessar esta página.
        </S.Description>

        <S.HomeButton to="/">
          <Home size={20} />
          Voltar para o Início
        </S.HomeButton>
      </S.ContentContainer>
    </S.PageContainer>
  );
};

export default Unauthorized;
