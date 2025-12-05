/**
 * Responsabilidade única: Campo de slug com verificação em tempo real
 */

import React from "react";
import * as S from "../RegisterArena.styles";

export interface SlugFieldProps {
  value: string;
  error?: string;
  checkingSlug: boolean;
  slugAvailable: boolean | null;
  disabled: boolean;
  onChange: (value: string) => void;
}

export const SlugField: React.FC<SlugFieldProps> = ({
  value,
  error,
  checkingSlug,
  slugAvailable,
  disabled,
  onChange,
}) => {
  return (
    <S.FormGroup>
      <S.Label htmlFor="slug">
        Slug (URL da Arena)
        <S.OptionalBadge>opcional</S.OptionalBadge>
      </S.Label>
      <S.SlugInputWrapper>
        <S.SlugPrefix>challengebt.com.br/arena/</S.SlugPrefix>
        <S.SlugInput
          type="text"
          id="slug"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          $hasError={!!error}
          disabled={disabled}
          placeholder="deixe em branco para gerar automaticamente"
        />
      </S.SlugInputWrapper>

      {checkingSlug && (
        <S.SlugStatus $status="checking">
          <S.SmallSpinner /> Verificando disponibilidade...
        </S.SlugStatus>
      )}

      {!checkingSlug && slugAvailable === true && value.length >= 3 && (
        <S.SlugStatus $status="available">✓ Slug disponível!</S.SlugStatus>
      )}

      {!checkingSlug && slugAvailable === false && (
        <S.SlugStatus $status="unavailable">✗ Slug já está em uso</S.SlugStatus>
      )}

      {error && <S.ErrorText>{error}</S.ErrorText>}

      <S.HelperText>
        {value
          ? "Apenas letras minúsculas, números e hífens."
          : "Será gerado automaticamente a partir do nome da arena."}
      </S.HelperText>
    </S.FormGroup>
  );
};

export default SlugField;
