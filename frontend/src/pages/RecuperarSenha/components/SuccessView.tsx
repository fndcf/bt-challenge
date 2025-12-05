/**
 * Responsabilidade única: Visualização de sucesso após envio do email
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import * as S from "../RecuperarSenha.styles";

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
    <S.SuccessContainer>
      <S.SuccessIcon>✉️</S.SuccessIcon>

      <S.SuccessTitle>Email enviado com sucesso!</S.SuccessTitle>

      <S.SuccessText>
        Enviamos um link de recuperação de senha para <strong>{email}</strong>.
        Verifique sua caixa de entrada e siga as instruções.
      </S.SuccessText>

      <S.HelpBox>
        <h3>Não recebeu o email?</h3>
        <ul>
          <li>Verifique sua caixa de spam ou lixo eletrônico</li>
          <li>Aguarde alguns minutos e tente novamente</li>
          <li>Certifique-se de que digitou o email corretamente</li>
          <li>Entre em contato com o suporte se o problema persistir</li>
        </ul>
      </S.HelpBox>

      <S.ActionButtons>
        <S.SecondaryButton onClick={onResend} disabled={loading}>
          {loading ? <S.Spinner /> : "Reenviar email"}
        </S.SecondaryButton>

        <S.PrimaryButton onClick={() => navigate("/login")}>
          Voltar ao login
        </S.PrimaryButton>
      </S.ActionButtons>
    </S.SuccessContainer>
  );
};

export default SuccessView;
