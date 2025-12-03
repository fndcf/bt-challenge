/**
 * CriarEtapa.styles.ts
 *
 * Responsabilidade única: Estilos centralizados da página CriarEtapa
 */

import styled from "styled-components";

// ============== LAYOUT PRINCIPAL ==============

export const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

export const Header = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
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
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9375rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

// ============== ALERTAS E MENSAGENS ==============

export const ErrorAlert = styled.div`
  margin-bottom: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;

  p:first-child {
    font-weight: 500;
    margin: 0 0 0.25rem 0;
  }

  p:last-child {
    font-size: 0.875rem;
    margin: 0;
  }
`;

// ============== FORMULÁRIO ==============

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

export const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// ============== CAMPOS DE FORMULÁRIO ==============

export const FieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
`;

export const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  border: 1px solid ${(props) => (props.$hasError ? "#fca5a5" : "#d1d5db")};
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: ${(props) => (props.$hasError ? "#ef4444" : "#3b82f6")};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #3b82f6;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const Select = styled.select`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #3b82f6;
  }
`;

export const HelperText = styled.p<{ $error?: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$error ? "#dc2626" : "#6b7280")};
  margin: 0.25rem 0 0 0;
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// ============== SELETOR DE FORMATO ==============

export const FormatoSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FormatoOption = styled.div<{ $selected: boolean }>`
  border: 2px solid ${(props) => (props.$selected ? "#3b82f6" : "#e5e7eb")};
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$selected ? "#f9fafb" : "white")};

  &:hover {
    border-color: #d1d5db;
  }
`;

export const FormatoTitle = styled.h3<{ $selected: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => (props.$selected ? "#111827" : "#6b7280")};
  margin: 0;
`;

export const FormatoDescription = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
`;


// ============== SELETOR DE CHAVEAMENTO ==============

export const ChaveamentoSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ChaveamentoOption = styled.div<{ $selected: boolean }>`
  border: 2px solid ${(props) => (props.$selected ? "#3b82f6" : "#e5e7eb")};
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$selected ? "#f9fafb" : "white")};

  &:hover {
    border-color: #d1d5db;
  }
`;

export const ChaveamentoTitle = styled.h4<{ $selected: boolean }>`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${(props) => (props.$selected ? "#111827" : "#374151")};
  margin: 0 0 0.25rem 0;
`;

export const ChaveamentoDescription = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;


// ============== PREVIEW DE DISTRIBUIÇÃO ==============

export const PreviewCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

export const PreviewTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
`;

export const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;

  strong {
    font-weight: 600;
  }
`;

export const PreviewBox = styled.div`
  background: white;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
`;

export const PreviewNote = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

// ============== BOTÕES ==============

export const ButtonsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`;

export const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #2563eb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background: #f9fafb;
    }
  `}
`;
