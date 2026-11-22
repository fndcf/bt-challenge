/**
 * Responsabilidade única: Formulário de email para recuperação de senha
 */

import React from "react";
import { Formulario } from "@/components/layout/Pagina";
import { Alert, Button, Input } from "@/components/ui";

export interface RecoveryFormProps {
  email: string;
  emailError: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const RecoveryForm: React.FC<RecoveryFormProps> = ({
  email,
  emailError,
  loading,
  onEmailChange,
  onSubmit,
}) => (
  <Formulario onSubmit={onSubmit} noValidate>
    <Alert>
      Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
    </Alert>

    <Input
      label="Email"
      type="email"
      id="email"
      required
      fullWidth
      value={email}
      onChange={(e) => onEmailChange(e.target.value)}
      error={emailError}
      disabled={loading}
      placeholder="seu@email.com"
      autoComplete="email"
      autoFocus
    />

    <Button type="submit" fullWidth loading={loading}>
      {loading ? "Enviando..." : "Enviar link de recuperação"}
    </Button>
  </Formulario>
);

export default RecoveryForm;
