/**
 * Responsabilidade única: Formulário de informações básicas da etapa
 */

import React from "react";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { FormatoEtapa } from "@/types/etapa";
import * as S from "../CriarEtapa.styles";

export interface InformacoesBasicasProps {
  nome: string;
  descricao: string;
  genero: GeneroJogador;
  nivel?: NivelJogador;
  local: string;
  formato?: FormatoEtapa;
  disabled?: boolean;
  disabledGenero?: boolean;
  disabledNivel?: boolean;
  helperGenero?: string;
  helperNivel?: string;
  onNomeChange: (nome: string) => void;
  onDescricaoChange: (descricao: string) => void;
  onGeneroChange: (genero: GeneroJogador) => void;
  onNivelChange: (nivel: NivelJogador | undefined) => void;
  onLocalChange: (local: string) => void;
}

export const InformacoesBasicas: React.FC<InformacoesBasicasProps> = ({
  nome,
  descricao,
  genero,
  nivel,
  local,
  formato,
  disabled = false,
  disabledGenero = false,
  disabledNivel = false,
  helperGenero,
  helperNivel,
  onNomeChange,
  onDescricaoChange,
  onGeneroChange,
  onNivelChange,
  onLocalChange,
}) => {
  // Super X não requer nivel
  const isSuperX = formato === FormatoEtapa.SUPER_X;
  const nivelObrigatorio = !isSuperX;

  return (
    <S.Card>
      <S.CardTitle>Informações Básicas</S.CardTitle>

      <S.FieldsContainer>
        <S.Field>
          <S.Label>Nome da Etapa *</S.Label>
          <S.Input
            type="text"
            required
            disabled={disabled}
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            placeholder="Ex: Etapa 1 - Classificatória"
          />
        </S.Field>

        <S.Field>
          <S.Label>Descrição</S.Label>
          <S.Textarea
            disabled={disabled}
            value={descricao}
            onChange={(e) => onDescricaoChange(e.target.value)}
            placeholder="Descreva os detalhes da etapa..."
            rows={3}
          />
        </S.Field>

        <S.Field>
          <S.Label>Gênero da Etapa *</S.Label>
          <S.Select
            required
            disabled={disabledGenero}
            value={genero}
            onChange={(e) => onGeneroChange(e.target.value as GeneroJogador)}
          >
            <option value={GeneroJogador.MASCULINO}>Masculino</option>
            <option value={GeneroJogador.FEMININO}>Feminino</option>
          </S.Select>
          <S.HelperText>
            {helperGenero ||
              "Apenas jogadores deste gênero poderão se inscrever"}
          </S.HelperText>
        </S.Field>

        <S.Field>
          <S.Label>Nível da Etapa {nivelObrigatorio && "*"}</S.Label>
          <S.Select
            required={nivelObrigatorio}
            disabled={disabledNivel}
            value={nivel || ""}
            onChange={(e) =>
              onNivelChange(
                e.target.value ? (e.target.value as NivelJogador) : undefined
              )
            }
          >
            {isSuperX && <option value="">Todos os níveis</option>}
            <option value={NivelJogador.INICIANTE}>Iniciante</option>
            <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
            <option value={NivelJogador.AVANCADO}>Avançado</option>
          </S.Select>
          <S.HelperText>
            {helperNivel ||
              (isSuperX
                ? "Opcional: deixe em branco para permitir todos os níveis"
                : "Apenas jogadores deste nível poderão se inscrever")}
          </S.HelperText>
        </S.Field>

        <S.Field>
          <S.Label>Local</S.Label>
          <S.Input
            type="text"
            disabled={disabled}
            value={local}
            onChange={(e) => onLocalChange(e.target.value)}
            placeholder="Ex: Quadras Arena Beach Tennis"
          />
        </S.Field>
      </S.FieldsContainer>
    </S.Card>
  );
};

export default InformacoesBasicas;
