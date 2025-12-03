/**
 * RecuperarSenha.styles.ts
 *
 * Estilos centralizados para a página de recuperação de senha
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

export const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  padding: 1rem;
`;

export const RecoveryContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

export const HeaderText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const Required = styled.span`
  color: #ef4444;
  margin-left: 0.25rem;
`;

export const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#2563eb")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.1)"};
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

export const ErrorText = styled.span`
  font-size: 0.8125rem;
  color: #ef4444;
  font-weight: 500;
`;

export const Alert = styled.div<{ $variant?: "error" | "success" }>`
  background: ${(props) =>
    props.$variant === "success" ? "#d1fae5" : "#fee2e2"};
  border: 1px solid
    ${(props) => (props.$variant === "success" ? "#a7f3d0" : "#fecaca")};
  color: ${(props) => (props.$variant === "success" ? "#065f46" : "#991b1b")};
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
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

export const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;

  p {
    margin: 0;
    color: #1e40af;
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
    min-height: 52px;
  }
`;

export const BackLinkContainer = styled.div`
  text-align: center;
  margin-top: 1.5rem;
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

export const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== SUCCESS VIEW ==============

export const SuccessContainer = styled.div`
  text-align: center;
`;

export const SuccessIcon = styled.div`
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  background: #d1fae5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
`;

export const SuccessTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

export const SuccessText = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 2rem 0;

  strong {
    color: #111827;
    font-weight: 600;
  }
`;

export const HelpBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 2rem;
  text-align: left;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.6;

    li {
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

export const SecondaryButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #eff6ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
