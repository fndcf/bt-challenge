/**
 * Responsabilidade: Hero section da landing page
 */

import React from "react";
import { Badge, ButtonLink } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";
import { getCoresFormato } from "@/styles/semantic";
import * as S from "../Home.styles";

export const HeroSection: React.FC = () => {
  return (
    <S.Hero>
      <S.Marca>Dupley</S.Marca>
      <S.Chamada>
        A plataforma completa para gerenciar seus torneios de beach tennis. Da
        inscrição ao pódio, com grupos, chaves e ranking gerados para você.
      </S.Chamada>
      <S.Acoes>
        <ButtonLink to="/register" size="lg">
          Criar Minha Arena
        </ButtonLink>
        <ButtonLink to="/login" size="lg" variant="outline">
          Fazer Login
        </ButtonLink>
      </S.Acoes>
      <S.Selos aria-label="Formatos disponíveis">
        {Object.values(FormatoEtapa).map((formato) => (
          <li key={formato}>
            <Badge formato={formato} tamanho="md">
              {getCoresFormato(formato).nome}
            </Badge>
          </li>
        ))}
      </S.Selos>
    </S.Hero>
  );
};

export default HeroSection;
