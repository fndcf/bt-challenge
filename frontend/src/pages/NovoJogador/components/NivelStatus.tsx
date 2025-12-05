/**
 * Responsabilidade única: Campos de nível e status do jogador
 */

import React from "react";
import { NivelJogador, StatusJogador } from "@/types/jogador";
import * as S from "../NovoJogador.styles";

export interface NivelStatusProps {
  nivel: NivelJogador;
  status: StatusJogador;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const NivelStatus: React.FC<NivelStatusProps> = ({
  nivel,
  status,
  onChange,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Nível e Status</S.CardTitle>
      <S.FormGrid>
        {/* Nível */}
        <S.FormGroup>
          <S.Label htmlFor="nivel">
            Nível <S.Required>*</S.Required>
          </S.Label>
          <S.Select
            id="nivel"
            name="nivel"
            value={nivel}
            onChange={onChange}
            required
          >
            <option value={NivelJogador.INICIANTE}>Iniciante</option>
            <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
            <option value={NivelJogador.AVANCADO}>Avançado</option>
          </S.Select>
          <S.HelperText>Escolha o nível de habilidade do jogador</S.HelperText>
        </S.FormGroup>

        {/* Status */}
        <S.FormGroup>
          <S.Label htmlFor="status">
            Status <S.Required>*</S.Required>
          </S.Label>
          <S.Select
            id="status"
            name="status"
            value={status}
            onChange={onChange}
            required
          >
            <option value={StatusJogador.ATIVO}>Ativo</option>
            <option value={StatusJogador.INATIVO}>Inativo</option>
            <option value={StatusJogador.SUSPENSO}>Suspenso</option>
          </S.Select>
          <S.HelperText>Status atual do jogador</S.HelperText>
        </S.FormGroup>
      </S.FormGrid>
    </S.Card>
  );
};

export default NivelStatus;
