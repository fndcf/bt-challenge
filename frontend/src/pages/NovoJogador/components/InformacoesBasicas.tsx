/**
 * InformacoesBasicas.tsx
 *
 * Responsabilidade única: Campos de informações básicas do jogador
 */

import React from "react";
import { GeneroJogador } from "@/types/jogador";
import * as S from "../NovoJogador.styles";

export interface InformacoesBasicasProps {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  genero: GeneroJogador;
  errors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export const InformacoesBasicas: React.FC<InformacoesBasicasProps> = ({
  nome,
  email,
  telefone,
  dataNascimento,
  genero,
  errors,
  onChange,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Informações Básicas</S.CardTitle>
      <S.FormGrid>
        {/* Nome Completo */}
        <S.FormGroup $fullWidth>
          <S.Label htmlFor="nome">
            Nome Completo <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="text"
            id="nome"
            name="nome"
            value={nome}
            onChange={onChange}
            placeholder="Ex: João Silva"
            $hasError={!!errors.nome}
            required
          />
          {errors.nome && <S.ErrorText>{errors.nome}</S.ErrorText>}
        </S.FormGroup>

        {/* Email */}
        <S.FormGroup>
          <S.Label htmlFor="email">Email</S.Label>
          <S.Input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="joao@email.com"
            $hasError={!!errors.email}
          />
          {errors.email && <S.ErrorText>{errors.email}</S.ErrorText>}
        </S.FormGroup>

        {/* Telefone */}
        <S.FormGroup>
          <S.Label htmlFor="telefone">Telefone</S.Label>
          <S.Input
            type="tel"
            id="telefone"
            name="telefone"
            value={telefone}
            onChange={onChange}
            placeholder="(00) 00000-0000"
            $hasError={!!errors.telefone}
            maxLength={15}
          />
          {errors.telefone && <S.ErrorText>{errors.telefone}</S.ErrorText>}
        </S.FormGroup>

        {/* Data de Nascimento */}
        <S.FormGroup>
          <S.Label htmlFor="dataNascimento">Data de Nascimento</S.Label>
          <S.Input
            type="date"
            id="dataNascimento"
            name="dataNascimento"
            value={dataNascimento}
            onChange={onChange}
            $hasError={!!errors.dataNascimento}
          />
          {errors.dataNascimento && (
            <S.ErrorText>{errors.dataNascimento}</S.ErrorText>
          )}
        </S.FormGroup>

        {/* Gênero */}
        <S.FormGroup>
          <S.Label htmlFor="genero">
            Gênero <S.Required>*</S.Required>
          </S.Label>
          <S.Select
            id="genero"
            name="genero"
            value={genero || ""}
            onChange={onChange}
          >
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </S.Select>
        </S.FormGroup>
      </S.FormGrid>
    </S.Card>
  );
};

export default InformacoesBasicas;
