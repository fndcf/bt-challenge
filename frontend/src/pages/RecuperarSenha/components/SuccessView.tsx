/**
 * Responsabilidade única: Visualização de sucesso após envio do email
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { AcoesFormulario } from "@/components/layout/Pagina";
import { Alert, Button } from "@/components/ui";

export interface SuccessViewProps {
  email: string;
  loading: boolean;
  onResend: () => Promise<void>;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  email,
  loading,
  onResend,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <Alert variant="success" title="Email enviado com sucesso!">
        Enviamos um link de recuperação de senha para <strong>{email}</strong>.
        Verifique sua caixa de entrada e siga as instruções.
      </Alert>

      <Alert title="Não recebeu o email?">
        <ul>
          <li>Verifique sua caixa de spam ou lixo eletrônico</li>
          <li>Aguarde alguns minutos e tente novamente</li>
          <li>Certifique-se de que digitou o email corretamente</li>
          <li>Entre em contato com o suporte se o problema persistir</li>
        </ul>
      </Alert>

      <AcoesFormulario>
        <Button variant="outline" onClick={onResend} loading={loading}>
          Reenviar email
        </Button>
        <Button onClick={() => navigate("/login")}>Voltar ao login</Button>
      </AcoesFormulario>
    </>
  );
};

export default SuccessView;
