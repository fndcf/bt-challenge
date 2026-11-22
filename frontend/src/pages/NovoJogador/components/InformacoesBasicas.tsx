/**
 * Responsabilidade única: Campos de informações básicas do jogador
 */

import React from "react";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Input, Select } from "@/components/ui";
import { GeneroJogador } from "@/types/jogador";

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

const GENEROS = [
  { value: GeneroJogador.MASCULINO, label: "Masculino" },
  { value: GeneroJogador.FEMININO, label: "Feminino" },
];

export const InformacoesBasicas: React.FC<InformacoesBasicasProps> = ({
  nome,
  email,
  telefone,
  dataNascimento,
  genero,
  errors,
  onChange,
}) => (
  <Cartao>
    <CartaoTitulo>Informações Básicas</CartaoTitulo>
    <Input
      label="Nome Completo"
      id="nome"
      name="nome"
      fullWidth
      required
      value={nome}
      onChange={onChange}
      placeholder="Ex: João Silva"
      error={errors.nome}
    />
    <Campos $colunas>
      <Input
        label="Email"
        type="email"
        id="email"
        name="email"
        fullWidth
        value={email}
        onChange={onChange}
        placeholder="joao@email.com"
        error={errors.email}
      />
      <Input
        label="Telefone"
        type="tel"
        id="telefone"
        name="telefone"
        fullWidth
        value={telefone}
        onChange={onChange}
        placeholder="(00) 00000-0000"
        maxLength={15}
        error={errors.telefone}
      />
      <Input
        label="Data de Nascimento"
        type="date"
        id="dataNascimento"
        name="dataNascimento"
        fullWidth
        value={dataNascimento}
        onChange={onChange}
        error={errors.dataNascimento}
      />
      <Select
        label="Gênero"
        id="genero"
        name="genero"
        fullWidth
        required
        options={GENEROS}
        value={genero || ""}
        onChange={onChange}
        error={errors.genero}
      />
    </Campos>
  </Cartao>
);

export default InformacoesBasicas;
