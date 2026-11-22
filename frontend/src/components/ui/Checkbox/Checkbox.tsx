/**
 * Caixa de seleção com rótulo e texto de ajuda
 */

import { InputHTMLAttributes, useId } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { CampoAjuda } from "../Campo/estilosCampo";

const { texto, acao } = theme.semantic;

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label: string;
  helperText?: string;
  onChange: (marcado: boolean) => void;
}

const Linha = styled.label<{ $desabilitado?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  min-height: 36px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${({ $desabilitado }) =>
    $desabilitado ? texto.secundario : texto.principal};
  cursor: ${({ $desabilitado }) => ($desabilitado ? "not-allowed" : "pointer")};

  input {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    accent-color: ${acao.primaria};
    cursor: inherit;
  }
`;

// Alinhada ao rótulo, depois da caixa
const Ajuda = styled(CampoAjuda)`
  display: block;
  padding-left: ${theme.spacing[8]};
`;

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  onChange,
  disabled,
  ...props
}) => {
  const ajudaId = useId();

  return (
    <div>
      <Linha $desabilitado={disabled}>
        <input
          type="checkbox"
          disabled={disabled}
          aria-describedby={helperText ? ajudaId : undefined}
          onChange={(e) => onChange(e.target.checked)}
          {...props}
        />
        {label}
      </Linha>
      {helperText && <Ajuda id={ajudaId}>{helperText}</Ajuda>}
    </div>
  );
};

export default Checkbox;
