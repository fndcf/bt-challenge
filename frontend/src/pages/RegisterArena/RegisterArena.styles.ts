import styled from "styled-components";
import { Link } from "react-router-dom";

export const PageContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  padding: 2rem 1rem;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 600px;
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

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2.25rem;
    }
  }

  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const Required = styled.span`
  color: #ef4444;
`;

export const OptionalBadge = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

export const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
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

export const SlugInputWrapper = styled.div`
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

export const SlugPrefix = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  border-right: 1px solid #e5e7eb;

  @media (max-width: 640px) {
    font-size: 0.75rem;
    padding: 0.75rem 0.5rem;
  }
`;

export const SlugInput = styled.input<{ $hasError?: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  font-size: 1rem;

  &:focus {
    outline: none;
  }
  &::placeholder {
    color: #9ca3af;
  }
  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

export const SlugStatus = styled.div<{
  $status: "checking" | "available" | "unavailable";
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.25rem;
  color: ${(props) =>
    props.$status === "checking"
      ? "#6b7280"
      : props.$status === "available"
      ? "#16a34a"
      : "#dc2626"};
`;

export const SmallSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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
  font-size: 0.875rem;
  font-weight: 500;
  ${(props) =>
    props.$type === "success"
      ? `background: #dcfce7; border: 1px solid #bbf7d0; color: #166534;`
      : `background: #fee2e2; border: 1px solid #fecaca; color: #991b1b;`}
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
`;

export const FormFooter = styled.div`
  text-align: center;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;

  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }
`;

export const StyledLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

export const BackLinkContainer = styled.div`
  text-align: center;
  margin-top: 1.5rem;
`;
