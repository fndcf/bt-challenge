/**
 * Confirmação padronizada de ações destrutivas
 *
 * A tela escolhe só a ação; título, mensagem, palavra a digitar e texto do
 * botão vêm daqui, iguais em todos os formatos de etapa.
 * Padrão: docs/ARCHITECTURE.md > "Confirmacoes destrutivas".
 */

import React from "react";
import { ConfirmacaoPerigosa } from "../ConfirmacaoPerigosa";

export type AcaoDestrutiva =
  | "encerrarEtapa"
  | "cancelarEliminatoria"
  | "excluirChaves";

interface Predefinicao {
  titulo: string;
  mensagem: string;
  palavraConfirmacao: string;
  textoBotao: string;
}

export const PREDEFINICOES_ACAO: Record<AcaoDestrutiva, Predefinicao> = {
  encerrarEtapa: {
    titulo: "Encerrar Etapa",
    mensagem:
      "Tem certeza que deseja encerrar esta etapa? O campeão será definido e os pontos do ranking serão atribuídos. Esta ação não pode ser desfeita.",
    palavraConfirmacao: "ENCERRAR",
    textoBotao: "Encerrar Etapa",
  },
  cancelarEliminatoria: {
    titulo: "Cancelar Eliminatória",
    mensagem:
      "Tem certeza que deseja cancelar a fase eliminatória? Os confrontos e os resultados do mata-mata serão apagados, e os resultados da fase de grupos voltam a poder ser editados. Esta ação não pode ser desfeita.",
    palavraConfirmacao: "CANCELAR",
    textoBotao: "Cancelar Eliminatória",
  },
  excluirChaves: {
    titulo: "Excluir Chaves",
    mensagem:
      "Tem certeza que deseja excluir todas as chaves? Grupos, partidas e resultados desta etapa serão apagados. Esta ação não pode ser desfeita.",
    palavraConfirmacao: "EXCLUIR",
    textoBotao: "Excluir Chaves",
  },
};

interface ConfirmacaoAcaoProps {
  acao: AcaoDestrutiva;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export const ConfirmacaoAcao: React.FC<ConfirmacaoAcaoProps> = ({
  acao,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const predefinicao = PREDEFINICOES_ACAO[acao];

  return (
    <ConfirmacaoPerigosa
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      titulo={predefinicao.titulo}
      mensagem={predefinicao.mensagem}
      palavraConfirmacao={predefinicao.palavraConfirmacao}
      textoBotaoConfirmar={predefinicao.textoBotao}
      loading={loading}
    />
  );
};

export default ConfirmacaoAcao;
