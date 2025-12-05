/**
 * Testes do componente LoginForm
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/pages/Login/components/LoginForm";

describe("LoginForm", () => {
  const defaultProps = {
    email: "",
    password: "",
    showPassword: false,
    errors: {},
    loading: false,
    onEmailChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onTogglePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar campos de email e senha", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it("deve exibir valores nos campos", () => {
    render(
      <LoginForm
        {...defaultProps}
        email="teste@email.com"
        password="minhasenha"
      />
    );

    expect(screen.getByLabelText(/email/i)).toHaveValue("teste@email.com");
    expect(screen.getByLabelText(/senha/i)).toHaveValue("minhasenha");
  });

  it("deve chamar onEmailChange ao digitar email", async () => {
    const onEmailChange = jest.fn();
    render(<LoginForm {...defaultProps} onEmailChange={onEmailChange} />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "a");

    expect(onEmailChange).toHaveBeenCalledWith("a");
  });

  it("deve chamar onPasswordChange ao digitar senha", async () => {
    const onPasswordChange = jest.fn();
    render(<LoginForm {...defaultProps} onPasswordChange={onPasswordChange} />);

    const passwordInput = screen.getByLabelText(/senha/i);
    await userEvent.type(passwordInput, "x");

    expect(onPasswordChange).toHaveBeenCalledWith("x");
  });

  it("deve exibir erros de validação", () => {
    render(
      <LoginForm
        {...defaultProps}
        errors={{
          email: "Email inválido",
          password: "Senha é obrigatória",
        }}
      />
    );

    expect(screen.getByText("Email inválido")).toBeInTheDocument();
    expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
  });

  it("deve desabilitar campos quando loading", () => {
    render(<LoginForm {...defaultProps} loading={true} />);

    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/senha/i)).toBeDisabled();
  });

  it("deve mostrar senha quando showPassword é true", () => {
    render(<LoginForm {...defaultProps} showPassword={true} />);

    expect(screen.getByLabelText(/senha/i)).toHaveAttribute("type", "text");
  });

  it("deve ocultar senha quando showPassword é false", () => {
    render(<LoginForm {...defaultProps} showPassword={false} />);

    expect(screen.getByLabelText(/senha/i)).toHaveAttribute("type", "password");
  });

  it("deve chamar onTogglePassword ao clicar no botão de toggle", async () => {
    const onTogglePassword = jest.fn();
    render(<LoginForm {...defaultProps} onTogglePassword={onTogglePassword} />);

    const toggleButton = screen.getByRole("button");
    await userEvent.click(toggleButton);

    expect(onTogglePassword).toHaveBeenCalledTimes(1);
  });

  it("deve ter placeholders corretos", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });
});
