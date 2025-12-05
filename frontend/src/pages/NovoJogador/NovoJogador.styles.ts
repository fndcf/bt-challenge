import styled from "styled-components";

export const PageContainer = styled.div`
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

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const Card = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  ${(props) =>
    props.$fullWidth &&
    `
    @media (min-width: 768px) {
      grid-column: 1 / -1;
    }
  `}
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

export const Select = styled.select<{ $hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#2563eb")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.1)"};
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

export const Textarea = styled.textarea<{ $hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  background: white;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;

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

export const HelperText = styled.small`
  font-size: 0.8125rem;
  color: #6b7280;
`;

export const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
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

export const FormActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

export const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-height: 48px;

  ${(props) =>
    props.$variant === "secondary"
      ? `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
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
    min-width: 140px;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    min-height: 52px;
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
