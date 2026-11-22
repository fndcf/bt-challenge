/**
 * Responsabilidade única: Campos de nível e status do jogador
 */

import React from "react";
import { Campos, Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Select } from "@/components/ui";
import { NivelJogador, StatusJogador } from "@/types/jogador";

export interface NivelStatusProps {
  nivel?: NivelJogador;
  status: StatusJogador;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const NIVEIS = [
  { value: NivelJogador.INICIANTE, label: "Iniciante" },
  { value: NivelJogador.INTERMEDIARIO, label: "Intermediário" },
  { value: NivelJogador.AVANCADO, label: "Avançado" },
];

const STATUS = [
  { value: StatusJogador.ATIVO, label: "Ativo" },
  { value: StatusJogador.INATIVO, label: "Inativo" },
  { value: StatusJogador.SUSPENSO, label: "Suspenso" },
];

export const NivelStatus: React.FC<NivelStatusProps> = ({
  nivel,
  status,
  onChange,
}) => (
  <Cartao>
    <CartaoTitulo>Nível e Status</CartaoTitulo>
    <Campos $colunas>
      <Select
        label="Nível"
        id="nivel"
        name="nivel"
        fullWidth
        required
        options={NIVEIS}
        value={nivel || ""}
        onChange={onChange}
        helperText="Escolha o nível de habilidade do jogador"
      />
      <Select
        label="Status"
        id="status"
        name="status"
        fullWidth
        required
        options={STATUS}
        value={status}
        onChange={onChange}
        helperText="Status atual do jogador"
      />
    </Campos>
  </Cartao>
);

export default NivelStatus;
