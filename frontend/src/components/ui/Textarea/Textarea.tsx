/**
 * Campo de texto longo com label, ajuda e erro
 */

import { TextareaHTMLAttributes, useId } from "react";
import styled from "styled-components";
import {
  CampoAjuda,
  CampoLabel,
  CampoWrapper,
  estiloCampo,
  TamanhoCampo,
} from "../Campo/estilosCampo";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const CampoTexto = styled.textarea<{ $hasError: boolean; $size: TamanhoCampo }>`
  ${estiloCampo}
  resize: vertical;
`;

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  ...props
}) => {
  const idGerado = useId();
  const campoId = id ?? idGerado;
  const ajudaId = `${campoId}-ajuda`;
  const ajuda = error || helperText;

  return (
    <CampoWrapper $fullWidth>
      {label && (
        <CampoLabel htmlFor={campoId} $required={required}>
          {label}
        </CampoLabel>
      )}
      <CampoTexto
        id={campoId}
        $hasError={!!error}
        $size="md"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={ajuda ? ajudaId : undefined}
        {...props}
      />
      {ajuda && (
        <CampoAjuda id={ajudaId} $erro={!!error}>
          {ajuda}
        </CampoAjuda>
      )}
    </CampoWrapper>
  );
};

export default Textarea;
