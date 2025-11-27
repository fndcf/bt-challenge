import React, { useState } from "react";
import styled from "styled-components";

interface ConfirmacaoPerigosaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  palavraConfirmacao: string;
  textoBotao?: string;
  loading?: boolean;
}

// ============== STYLED COMPONENTS ==============

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
`;

const OverlayBackground = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  transition: opacity 0.2s;
`;

const ModalWrapper = styled.div`
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  position: relative;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 28rem;
  width: 100%;
  padding: 1.5rem;
`;

const IconWarning = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  background: #fee2e2;
  border-radius: 50%;

  span {
    font-size: 1.5rem;
  }
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 0.5rem 0;
`;

const Message = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1.5rem;
  white-space: pre-line;
`;

const InputSection = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const RequiredWord = styled.span`
  font-weight: 700;
  color: #dc2626;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #dc2626;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ValidationMessage = styled.p<{ $isValid: boolean }>`
  font-size: 0.75rem;
  margin-top: 0.25rem;
  color: ${(props) => (props.$isValid ? "#16a34a" : "#dc2626")};
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #dc2626;
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background: #b91c1c;
    }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== COMPONENTE ==============

export const ConfirmacaoPerigosa: React.FC<ConfirmacaoPerigosaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  palavraConfirmacao,
  textoBotao = "Confirmar",
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  const isConfirmacaoCorreta =
    inputValue.toUpperCase() === palavraConfirmacao.toUpperCase();

  const handleConfirm = () => {
    if (isConfirmacaoCorreta) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <OverlayBackground onClick={handleClose} />

      <ModalWrapper>
        <ModalContainer>
          <IconWarning>
            <span>⚠️</span>
          </IconWarning>

          <Title>{titulo}</Title>

          <Message>{mensagem}</Message>

          <InputSection>
            <Label>
              Para confirmar, digite{" "}
              <RequiredWord>{palavraConfirmacao}</RequiredWord>
            </Label>
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Digite "${palavraConfirmacao}"`}
              disabled={loading}
              autoFocus
            />
            {inputValue && !isConfirmacaoCorreta && (
              <ValidationMessage $isValid={false}>
                Texto incorreto
              </ValidationMessage>
            )}
            {isConfirmacaoCorreta && (
              <ValidationMessage $isValid={true}>
                Texto correto
              </ValidationMessage>
            )}
          </InputSection>

          <ButtonsRow>
            <Button
              type="button"
              $variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              $variant="primary"
              onClick={handleConfirm}
              disabled={!isConfirmacaoCorreta || loading}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Processando...</span>
                </>
              ) : (
                <span>{textoBotao}</span>
              )}
            </Button>
          </ButtonsRow>
        </ModalContainer>
      </ModalWrapper>
    </Overlay>
  );
};

export default ConfirmacaoPerigosa;
