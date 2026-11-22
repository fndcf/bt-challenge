/**
 * Confirmações e avisos do sistema
 *
 * Use no lugar de window.confirm e alert: o iPhone pode suprimir os diálogos do
 * navegador, e aí o confirm devolve false e o botão parece não funcionar.
 * Quem desenha é o componente Dialogos, montado no App.
 */

export type TipoAviso = "success" | "warning" | "error";

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  /** Ação destrutiva: botão vermelho */
  perigo?: boolean;
}

export interface HostDialogos {
  confirmar: (pedido: PedidoConfirmacao) => Promise<boolean>;
  avisar: (mensagem: string, tipo: TipoAviso) => void;
}

const CHAVE_AVISO = "avisoAposRecarregar";

let host: HostDialogos | null = null;

/** Chamado pelo componente Dialogos. Devolve a função que desfaz o registro. */
export const registrarDialogos = (novo: HostDialogos): (() => void) => {
  host = novo;
  return () => {
    if (host === novo) host = null;
  };
};

/** Pergunta e espera a resposta. Sem quem desenhe a pergunta, vale "não". */
export const confirmar = (pedido: PedidoConfirmacao): Promise<boolean> =>
  host ? host.confirmar(pedido) : Promise.resolve(false);

export const avisarSucesso = (mensagem: string): void =>
  host?.avisar(mensagem, "success");

export const avisarAtencao = (mensagem: string): void =>
  host?.avisar(mensagem, "warning");

export const avisarErro = (mensagem: string): void =>
  host?.avisar(mensagem, "error");

/** Recarrega a página e mostra o aviso depois (antes, ele sumiria junto) */
export const recarregarComAviso = (mensagem: string): void => {
  try {
    sessionStorage.setItem(CHAVE_AVISO, mensagem);
  } catch {
    // Sem armazenamento: recarrega sem o aviso
  }
  window.location.reload();
};

/** Lê e apaga o aviso deixado por recarregarComAviso */
export const lerAvisoAposRecarregar = (): string | null => {
  try {
    const mensagem = sessionStorage.getItem(CHAVE_AVISO);
    sessionStorage.removeItem(CHAVE_AVISO);
    return mensagem;
  } catch {
    return null;
  }
};
