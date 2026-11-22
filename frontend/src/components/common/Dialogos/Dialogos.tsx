/**
 * Desenha as confirmações e os avisos pedidos por utils/dialogos
 * Montado uma vez, no App, dentro do ToastProvider.
 */

import React, { useEffect, useRef, useState } from "react";
import { ConfirmacaoPerigosa } from "@/components/modals/ConfirmacaoPerigosa";
import { useToast } from "@/components/ui";
import {
  lerAvisoAposRecarregar,
  PedidoConfirmacao,
  registrarDialogos,
} from "@/utils/dialogos";

export const Dialogos: React.FC = () => {
  const { showToast } = useToast();
  const [pergunta, setPergunta] = useState<PedidoConfirmacao | null>(null);
  const responderRef = useRef<((resposta: boolean) => void) | null>(null);

  useEffect(
    () =>
      registrarDialogos({
        avisar: showToast,
        confirmar: (pedido) =>
          new Promise((resolver) => {
            // Uma pergunta nova cancela a que estava aberta
            responderRef.current?.(false);
            responderRef.current = resolver;
            setPergunta(pedido);
          }),
      }),
    [showToast]
  );

  useEffect(() => {
    const mensagem = lerAvisoAposRecarregar();
    if (mensagem) showToast(mensagem, "success");
  }, [showToast]);

  if (!pergunta) return null;

  const responder = (resposta: boolean) => {
    const resolver = responderRef.current;
    responderRef.current = null;
    setPergunta(null);
    resolver?.(resposta);
  };

  return (
    <ConfirmacaoPerigosa
      isOpen
      titulo={pergunta.titulo}
      mensagem={pergunta.mensagem}
      textoBotaoConfirmar={pergunta.textoConfirmar}
      variante={pergunta.perigo ? "danger" : "warning"}
      onConfirm={() => responder(true)}
      onClose={() => responder(false)}
    />
  );
};

export default Dialogos;
