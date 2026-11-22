/**
 * Modal para importação de jogadores via planilha Excel
 */

import React, { useState } from "react";
import styled from "styled-components";
import { CheckCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { theme } from "@/styles/theme";

interface ImportResult {
  criados: number;
  ignorados: string[];
}

interface ModalImportarJogadoresProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resultado: ImportResult) => void;
  onImportar: (file: File) => Promise<ImportResult>;
  onExportarModelo: () => Promise<void>;
}

export const ModalImportarJogadores: React.FC<ModalImportarJogadoresProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onImportar,
  onExportarModelo,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingModelo, setDownloadingModelo] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (
        droppedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Formato inválido. Envie um arquivo .xlsx");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImportar = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const resultado = await onImportar(file);
      onSuccess({ criados: resultado.criados, ignorados: resultado.ignorados });
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao importar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarModelo = async () => {
    setDownloadingModelo(true);
    try {
      await onExportarModelo();
    } catch {
      setError("Erro ao baixar modelo");
    } finally {
      setDownloadingModelo(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError("");
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Jogadores"
      loading={loading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleImportar} disabled={!file || loading}>
            {loading ? "Importando..." : "Importar Jogadores"}
          </Button>
        </>
      }
    >
        <Content>
          <Instructions>
            <p>Envie uma planilha Excel (.xlsx) com os jogadores.</p>
            <p><strong>Colunas obrigatórias:</strong> Nome Completo, Genero, Nivel</p>
            <p><strong>Colunas opcionais:</strong> Email, Telefone, Data de Nascimento, Observacoes</p>
            <InstructionDetails>
              <li><strong>Genero:</strong> Masculino, Feminino, M ou F</li>
              <li><strong>Nivel:</strong> Iniciante, Intermediário ou Avançado</li>
              <li><strong>Data de Nascimento:</strong> formato YYYY-MM-DD</li>
              <li>Status será definido como <strong>Ativo</strong> automaticamente</li>
            </InstructionDetails>
          </Instructions>

          <div>
          <Button
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet size={16} />}
            onClick={handleBaixarModelo}
            loading={downloadingModelo}
          >
            {downloadingModelo ? "Baixando..." : "Baixar modelo com jogadores atuais"}
          </Button>
          </div>

          <DropZone
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            $hasFile={!!file}
          >
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
            />

            {file ? (
              <FileInfo>
                <CheckCircle aria-hidden="true" size={24} />
                <FileName>{file.name}</FileName>
                <FileSize>({(file.size / 1024).toFixed(1)} KB)</FileSize>
              </FileInfo>
            ) : (
              <DropZoneContent>
                <Upload aria-hidden="true" size={32} />
                <DropText>Arraste o arquivo aqui ou clique para selecionar</DropText>
                <DropSubtext>Apenas arquivos .xlsx (máx. 5MB)</DropSubtext>
              </DropZoneContent>
            )}
          </DropZone>

          {error && (
            <div role="alert">
              <Alert variant="error">
                <ErrorText>{error}</ErrorText>
              </Alert>
            </div>
          )}
        </Content>
    </Modal>
  );
};

// ============== STYLED COMPONENTS ==============

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const Instructions = styled.div`
  font-size: ${fontSize.sm};
  line-height: 1.5;
  color: ${texto.principal};

  p {
    margin: 0 0 ${theme.spacing[1]} 0;
  }
`;

const InstructionDetails = styled.ul`
  margin: ${theme.spacing[2]} 0 0 0;
  padding-left: ${theme.spacing[5]};
  color: ${texto.secundario};
`;

const DropZone = styled.label<{ $hasFile: boolean }>`
  display: block;
  padding: ${theme.spacing[8]} ${theme.spacing[4]};
  border: 2px dashed
    ${({ $hasFile }) =>
      $hasFile ? status.sucesso.texto : superficie.bordaForte};
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $hasFile }) =>
    $hasFile ? status.sucesso.fundo : superficie.fundoAlternativo};
  color: ${({ $hasFile }) =>
    $hasFile ? status.sucesso.texto : texto.secundario};
  text-align: center;
  cursor: pointer;

  &:hover,
  &:focus-within {
    border-color: ${acao.primaria};
  }

  /* Escondido só visualmente: continua acessível pelo teclado */
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
`;

const DropZoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const DropText = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.medium};
  color: ${texto.principal};
`;

const DropSubtext = styled.p`
  margin: 0;
  font-size: ${fontSize.xs};
`;

const FileInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
`;

const FileName = styled.span`
  overflow-wrap: anywhere;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
`;

const FileSize = styled.span`
  font-size: ${fontSize.sm};
`;

const ErrorText = styled.div`
  white-space: pre-line;
`;

export default ModalImportarJogadores;
