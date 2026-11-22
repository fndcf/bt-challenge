/**
 * Responsabilidade única: Formulário de informações básicas da etapa
 */

import React from "react";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Input, Select, Textarea } from "@/components/ui";
import {
  FormatoEtapa,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
} from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

export interface InformacoesBasicasProps {
  nome: string;
  descricao: string;
  genero: GeneroJogador;
  nivel?: NivelJogador | null;
  local: string;
  formato?: FormatoEtapa;
  tipoFormacaoEquipe?: TipoFormacaoEquipe; // Para TEAMS: determinar se nível é obrigatório
  tipoFormacaoDupla?: TipoFormacaoDupla; // Para DUPLA_FIXA: determinar se nível é obrigatório
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

const GENEROS = [
  { value: GeneroJogador.MASCULINO, label: "Masculino" },
  { value: GeneroJogador.FEMININO, label: "Feminino" },
];

const NIVEIS = [
  { value: NivelJogador.INICIANTE, label: "Iniciante" },
  { value: NivelJogador.INTERMEDIARIO, label: "Intermediário" },
  { value: NivelJogador.AVANCADO, label: "Avançado" },
];

export const InformacoesBasicas: React.FC<InformacoesBasicasProps> = ({
  nome,
  descricao,
  genero,
  nivel,
  local,
  formato,
  tipoFormacaoEquipe,
  tipoFormacaoDupla,
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
  const isTeams = formato === FormatoEtapa.TEAMS;
  const isDuplaFixa = formato === FormatoEtapa.DUPLA_FIXA;
  const permiteMisto = isTeams || isDuplaFixa;

  // Nível obrigatório: Dupla Fixa (exceto Balanceado) e TEAMS com Mesmo Nível.
  // Nos demais casos a etapa pode aceitar todos os níveis.
  const nivelObrigatorio =
    (isDuplaFixa && tipoFormacaoDupla !== TipoFormacaoDupla.BALANCEADO) ||
    (isTeams && tipoFormacaoEquipe === TipoFormacaoEquipe.MESMO_NIVEL);

  return (
    <Cartao>
      <CartaoTitulo>Informações Básicas</CartaoTitulo>

      <Input
        label="Nome da Etapa"
        required
        fullWidth
        disabled={disabled}
        value={nome}
        onChange={(e) => onNomeChange(e.target.value)}
        placeholder="Ex: Etapa 1 - Classificatória"
      />

      <Textarea
        label="Descrição"
        disabled={disabled}
        value={descricao}
        onChange={(e) => onDescricaoChange(e.target.value)}
        placeholder="Descreva os detalhes da etapa..."
        rows={3}
      />

      <Campos $colunas>
        <Select
          label="Gênero da Etapa"
          required
          fullWidth
          disabled={disabledGenero}
          options={
            permiteMisto
              ? [...GENEROS, { value: GeneroJogador.MISTO, label: "Misto" }]
              : GENEROS
          }
          value={genero}
          onChange={(e) => onGeneroChange(e.target.value as GeneroJogador)}
          helperText={
            helperGenero ||
            (permiteMisto
              ? "Misto: duplas com 1 masculino + 1 feminino"
              : "Apenas jogadores deste gênero poderão se inscrever")
          }
        />

        <Select
          label="Nível da Etapa"
          required={nivelObrigatorio}
          fullWidth
          disabled={disabledNivel}
          options={
            nivelObrigatorio
              ? NIVEIS
              : [{ value: "", label: "Todos os níveis" }, ...NIVEIS]
          }
          value={nivel || ""}
          onChange={(e) =>
            onNivelChange((e.target.value as NivelJogador) || undefined)
          }
          helperText={
            helperNivel ||
            (nivelObrigatorio
              ? "Apenas jogadores deste nível poderão se inscrever"
              : "Opcional: deixe em branco para permitir todos os níveis")
          }
        />
      </Campos>

      <Input
        label="Local"
        fullWidth
        disabled={disabled}
        value={local}
        onChange={(e) => onLocalChange(e.target.value)}
        placeholder="Ex: Quadras Arena"
      />
    </Cartao>
  );
};

export default InformacoesBasicas;
