/**
 * Cadastro de um jogador novo sem sair da inscrição
 */

import React from "react";
import styled from "styled-components";
import { Input, Select } from "@/components/ui";
import { theme } from "@/styles/theme";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getGeneroLabel, getNivelLabel } from "@/utils/formatters";
import { NovoJogador } from "../hooks/useModalInscricao";

interface FormNovoJogadorProps {
  /** O botão de cadastrar fica no rodapé do modal */
  id: string;
  jogador: NovoJogador;
  onChange: (jogador: NovoJogador) => void;
  onCadastrar: () => void;
  /** Etapa mista: escolhe o gênero */
  escolheGenero: boolean;
  /** Etapa de nível livre: escolhe o nível */
  escolheNivel: boolean;
}

const Formulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  width: 100%;
  max-width: 32rem;
  margin: 0 auto;
`;

const Definidos = styled.p`
  margin: 0;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.semantic.texto.secundario};
`;

const opcoes = <T extends string>(valores: T[], rotulo: (v: T) => string) =>
  valores.map((value) => ({ value, label: rotulo(value) }));

const OPCOES_GENERO = opcoes(
  [GeneroJogador.MASCULINO, GeneroJogador.FEMININO],
  getGeneroLabel
);

const OPCOES_NIVEL = opcoes(
  [
    NivelJogador.INICIANTE,
    NivelJogador.INTERMEDIARIO,
    NivelJogador.AVANCADO,
  ],
  getNivelLabel
);

export const FormNovoJogador: React.FC<FormNovoJogadorProps> = ({
  id,
  jogador,
  onChange,
  onCadastrar,
  escolheGenero,
  escolheNivel,
}) => {
  const alterar = (campos: Partial<NovoJogador>) =>
    onChange({ ...jogador, ...campos });

  // O que a etapa já define não é pergunta: só informa
  const definidos = [
    !escolheGenero && `Gênero: ${getGeneroLabel(jogador.genero)}`,
    !escolheNivel && `Nível: ${getNivelLabel(jogador.nivel)}`,
  ].filter(Boolean);

  return (
    <Formulario
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        onCadastrar();
      }}
    >
      {definidos.length > 0 && (
        <Definidos>{`Definido pela etapa: ${definidos.join(" · ")}`}</Definidos>
      )}

      <Input
        label="Nome"
        required
        fullWidth
        placeholder="Nome completo"
        value={jogador.nome}
        onChange={(e) => alterar({ nome: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        fullWidth
        placeholder="email@exemplo.com"
        value={jogador.email}
        onChange={(e) => alterar({ email: e.target.value })}
      />
      <Input
        label="Telefone"
        type="tel"
        fullWidth
        placeholder="(00) 00000-0000"
        value={jogador.telefone}
        onChange={(e) => alterar({ telefone: e.target.value })}
      />

      {escolheGenero && (
        <Select
          label="Gênero"
          required
          fullWidth
          helperText="Etapa mista: selecione o gênero do jogador"
          options={OPCOES_GENERO}
          value={jogador.genero}
          onChange={(e) => alterar({ genero: e.target.value as GeneroJogador })}
        />
      )}

      {escolheNivel && (
        <Select
          label="Nível"
          required
          fullWidth
          helperText="Etapa nível livre: selecione o nível do jogador"
          options={OPCOES_NIVEL}
          value={jogador.nivel}
          onChange={(e) => alterar({ nivel: e.target.value as NivelJogador })}
        />
      )}
    </Formulario>
  );
};
