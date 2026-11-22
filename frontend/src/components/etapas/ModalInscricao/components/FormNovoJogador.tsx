/**
 * Cadastro de um jogador novo sem sair da inscrição
 */

import React from "react";
import styled from "styled-components";
import { Button, Input, Select } from "@/components/ui";
import { theme } from "@/styles/theme";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getGeneroLabel, getNivelLabel } from "@/utils/formatters";
import { NovoJogador } from "../hooks/useModalInscricao";

interface FormNovoJogadorProps {
  jogador: NovoJogador;
  onChange: (jogador: NovoJogador) => void;
  onCadastrar: () => void;
  loading: boolean;
  /** Etapa mista: escolhe o gênero */
  escolheGenero: boolean;
  /** Etapa de nível livre: escolhe o nível */
  escolheNivel: boolean;
}

const Formulario = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  max-width: 32rem;
  margin: 0 auto;
`;

const Titulo = styled.h3`
  margin: 0;
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.semantic.texto.principal};
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
  jogador,
  onChange,
  onCadastrar,
  loading,
  escolheGenero,
  escolheNivel,
}) => {
  const alterar = (campos: Partial<NovoJogador>) =>
    onChange({ ...jogador, ...campos });

  return (
    <Formulario>
      <Titulo>Cadastrar Novo Jogador</Titulo>

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

      {escolheGenero ? (
        <Select
          label="Gênero"
          required
          fullWidth
          helperText="Etapa mista: selecione o gênero do jogador"
          options={OPCOES_GENERO}
          value={jogador.genero}
          onChange={(e) => alterar({ genero: e.target.value as GeneroJogador })}
        />
      ) : (
        <Input
          label="Gênero"
          disabled
          fullWidth
          helperText="O jogador será criado automaticamente com o gênero desta etapa"
          value={getGeneroLabel(jogador.genero)}
        />
      )}

      {escolheNivel ? (
        <Select
          label="Nível"
          required
          fullWidth
          helperText="Etapa nível livre: selecione o nível do jogador"
          options={OPCOES_NIVEL}
          value={jogador.nivel}
          onChange={(e) => alterar({ nivel: e.target.value as NivelJogador })}
        />
      ) : (
        <Input
          label="Nível"
          disabled
          fullWidth
          helperText="O jogador será criado automaticamente com o nível desta etapa"
          value={getNivelLabel(jogador.nivel)}
        />
      )}

      <Button
        fullWidth
        onClick={onCadastrar}
        disabled={loading || !jogador.nome.trim()}
      >
        {loading ? "Cadastrando..." : "Cadastrar Jogador"}
      </Button>
    </Formulario>
  );
};
