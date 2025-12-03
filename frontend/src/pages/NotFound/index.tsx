/**
 * NotFound/index.tsx
 *
 * Responsabilidade única: Página 404 - Rota não encontrada
 *
 * SOLID aplicado:
 * - SRP: Apenas renderiza a estrutura da página 404
 * - OCP: Estilos e animações são extensíveis via styled-components
 */

import React from "react";
import { Home } from "lucide-react";
import { useDocumentTitle } from "@/hooks";
import * as S from "./NotFound.styles";

export const NotFound: React.FC = () => {
  useDocumentTitle("Página não encontrada");

  return (
    <S.PageContainer>
      {/* Floating Decorations */}
      <S.FloatingShape $size={150} $left={10} $top={20} $delay={0} />
      <S.FloatingShape $size={100} $left={80} $top={60} $delay={2} />
      <S.FloatingShape $size={120} $left={15} $top={70} $delay={4} />

      <S.ContentContainer>
        <S.ErrorCode>404</S.ErrorCode>
        <S.Title>Página não encontrada</S.Title>
        <S.Description>
          Desculpe, a página que você está procurando não existe ou foi movida.
        </S.Description>

        <S.HomeButton to="/">
          <Home size={20} />
          Voltar para o Início
        </S.HomeButton>
      </S.ContentContainer>
    </S.PageContainer>
  );
};

export default NotFound;
