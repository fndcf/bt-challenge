/**
 * Responsabilidade única: Cabeçalho do perfil com avatar, nome e selos
 */

import React from "react";
import styled from "styled-components";
import { SeloGenero } from "@/components/jogadores/Genero";
import { Cartao, CartaoTitulo, Texto } from "@/components/layout/Pagina";
import { Badge } from "@/components/ui";
import { theme } from "@/styles/theme";
import { getGeneroLabel, getNivelLabel } from "@/utils/formatters";

export interface ProfileHeaderProps {
  nomeJogador: string;
  arenaNome: string;
  nivelJogador?: string;
  generoJogador?: string;
  getInitials: (nome: string) => string;
}

const { acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Linha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 5rem;
  height: 5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${acao.fundoClaro};
  color: ${acao.primaria};
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
`;

const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  margin-top: ${theme.spacing[2]};
`;

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  nomeJogador,
  arenaNome,
  nivelJogador,
  generoJogador,
  getInitials,
}) => (
  <Cartao>
    <Linha>
      <Avatar aria-hidden="true">{getInitials(nomeJogador)}</Avatar>
      <div>
        <CartaoTitulo>{nomeJogador}</CartaoTitulo>
        <Texto>Jogador da {arenaNome}</Texto>
        <Selos>
          {nivelJogador && <Badge>{getNivelLabel(nivelJogador)}</Badge>}
          {generoJogador && (
            <SeloGenero genero={generoJogador}>
              {getGeneroLabel(generoJogador)}
            </SeloGenero>
          )}
        </Selos>
      </div>
    </Linha>
  </Cartao>
);

export default ProfileHeader;
