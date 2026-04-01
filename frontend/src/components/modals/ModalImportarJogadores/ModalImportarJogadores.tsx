/**
 * Modal para importação de jogadores via planilha Excel
 */

import React, { useState, useRef } from "react";
import styled from "styled-components";
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <Overlay onClick={handleClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderTitle>
            <FileSpreadsheet size={24} />
            Importar Jogadores
          </HeaderTitle>
          <CloseButton onClick={handleClose}>
            <X size={20} />
          </CloseButton>
        </Header>

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

          <ModeloButton onClick={handleBaixarModelo} disabled={downloadingModelo}>
            <FileSpreadsheet size={16} />
            {downloadingModelo ? "Baixando..." : "Baixar modelo com jogadores atuais"}
          </ModeloButton>

          <DropZone
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            $hasFile={!!file}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {file ? (
              <FileInfo>
                <CheckCircle size={24} color="#16a34a" />
                <FileName>{file.name}</FileName>
                <FileSize>({(file.size / 1024).toFixed(1)} KB)</FileSize>
              </FileInfo>
            ) : (
              <DropZoneContent>
                <Upload size={32} color="#9ca3af" />
                <DropText>Arraste o arquivo aqui ou clique para selecionar</DropText>
                <DropSubtext>Apenas arquivos .xlsx (máx. 5MB)</DropSubtext>
              </DropZoneContent>
            )}
          </DropZone>

          {error && (
            <ErrorBox>
              <AlertCircle size={16} />
              <ErrorText>{error}</ErrorText>
            </ErrorBox>
          )}
        </Content>

        <Footer>
          <CancelButton onClick={handleClose} disabled={loading}>
            Cancelar
          </CancelButton>
          <ImportButton onClick={handleImportar} disabled={!file || loading}>
            {loading ? "Importando..." : "Importar Jogadores"}
          </ImportButton>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
};

// ============== STYLED COMPONENTS ==============

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const Instructions = styled.div`
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;

  p {
    margin: 0 0 0.25rem 0;
  }
`;

const InstructionDetails = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  color: #6b7280;

  li {
    margin-bottom: 0.125rem;
  }
`;

const ModeloButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #dcfce7;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DropZone = styled.div<{ $hasFile: boolean }>`
  border: 2px dashed ${(p) => (p.$hasFile ? "#16a34a" : "#d1d5db")};
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) => (p.$hasFile ? "#f0fdf4" : "#fafafa")};

  &:hover {
    border-color: ${(p) => (p.$hasFile ? "#16a34a" : "#2563eb")};
    background: ${(p) => (p.$hasFile ? "#f0fdf4" : "#eff6ff")};
  }
`;

const DropZoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const DropText = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
`;

const DropSubtext = styled.p`
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const FileName = styled.span`
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
`;

const FileSize = styled.span`
  color: #6b7280;
  font-size: 0.8125rem;
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  color: #991b1b;

  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`;

const ErrorText = styled.div`
  font-size: 0.8125rem;
  white-space: pre-line;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImportButton = styled.button`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  background: #2563eb;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ModalImportarJogadores;
