/**
 * SearchBar.tsx
 *
 * Responsabilidade única: Campo de busca de jogadores
 */

import React from "react";
import * as S from "../Jogadores.styles";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Nome, email ou telefone...",
}) => {
  return (
    <S.SearchContainer>
      <S.SearchInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </S.SearchContainer>
  );
};

export default SearchBar;
