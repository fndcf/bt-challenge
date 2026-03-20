/**
 * Responsabilidade única: Exibir cabeçalho da página com título e botões de ação
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import * as S from "../Jogadores.styles";

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  onExportar?: () => void;
  onImportar?: () => void;
  exportando?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onExportar,
  onImportar,
  exportando,
}) => {
  const navigate = useNavigate();

  const handleNovoJogador = () => {
    navigate("/admin/jogadores/novo");
  };

  return (
    <S.Header>
      <S.HeaderInfo>
        <S.Title>{title}</S.Title>
        <S.Subtitle>{subtitle}</S.Subtitle>
      </S.HeaderInfo>
      <S.HeaderActions>
        {onExportar && (
          <S.SecondaryButton onClick={onExportar} disabled={exportando}>
            <Download size={16} />
            {exportando ? "Exportando..." : "Exportar"}
          </S.SecondaryButton>
        )}
        {onImportar && (
          <S.SecondaryButton onClick={onImportar}>
            <Upload size={16} />
            Importar
          </S.SecondaryButton>
        )}
        <S.NewButton onClick={handleNovoJogador}>Novo Jogador</S.NewButton>
      </S.HeaderActions>
    </S.Header>
  );
};

export default PageHeader;
