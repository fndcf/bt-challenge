/**
 * EditarJogador.styles.ts
 *
 * Estilos centralizados para a página de editar jogador
 */

import styled from "styled-components";

export const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

export const Header = styled.div`
  margin-bottom: 2rem;
`;

export const BackButton = styled.button`
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: color 0.2s;
  padding: 0;

  &:hover {
    color: #111827;
  }
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

export const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
`;

export const Spinner = styled.div<{ $size?: "small" | "large" }>`
  width: ${(props) => (props.$size === "small" ? "1.25rem" : "3rem")};
  height: ${(props) => (props.$size === "small" ? "1.25rem" : "3rem")};
  border: ${(props) => (props.$size === "small" ? "2px" : "4px")} solid
    ${(props) => (props.$size === "small" ? "rgba(255, 255, 255, 0.3)" : "#dbeafe")};
  border-top-color: ${(props) => (props.$size === "small" ? "white" : "#2563eb")};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingMessage = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
`;

export const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  ${(props) =>
    props.$type === "success"
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  `
      : `
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
  `}
`;

export const AlertContent = styled.div`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const AlertClose = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const FormActions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 0.75rem;
  padding-top: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

export const Button = styled.button<{ $variant?: "primary" | "cancel" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "cancel"
      ? `
    background: #f3f4f6;
    color: #374151;

    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `
      : `
    background: #2563eb;
    color: white;

    &:hover:not(:disabled) {
      background: #1d4ed8;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-width: 640px) {
    width: auto;
    min-width: 150px;
  }
`;
