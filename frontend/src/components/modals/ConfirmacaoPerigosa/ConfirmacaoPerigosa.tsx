import React, { useId, useState } from "react";
import styled from "styled-components";
import { Button, Input, Modal } from "@/components/ui";
import { theme } from "@/styles/theme";

interface ConfirmacaoPerigosaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  palavraConfirmacao?: string; // Opcional - quando não fornecido, não exige digitação
  textoBotao?: string;
  textoBotaoConfirmar?: string; // Alias para textoBotao
  loading?: boolean;
  variante?: "danger" | "warning"; // warning não exige digitação
}

const { texto, status } = theme.semantic;

// ============== STYLED COMPONENTS ==============

const Message = styled.div`
  font-size: 0.875rem;
  color: ${texto.secundario};
  line-height: 1.5;
  white-space: pre-line;
`;

const InputSection = styled.div`
  margin-top: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${texto.principal};
  margin-bottom: 0.5rem;
`;

const RequiredWord = styled.span`
  font-weight: 700;
  color: ${status.erro.texto};
`;

const ValidationMessage = styled.p<{ $isValid: boolean }>`
  font-size: 0.75rem;
  margin: 0.25rem 0 0 0;
  color: ${(props) => (props.$isValid ? status.sucesso.texto : status.erro.texto)};
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
  textoBotaoConfirmar,
  loading = false,
  variante = "danger",
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputId = useId();

  // Se variante é warning ou não há palavraConfirmacao, não exige digitação
  const exigeDigitacao = variante === "danger" && !!palavraConfirmacao;

  const isConfirmacaoCorreta = exigeDigitacao
    ? inputValue.toUpperCase() === palavraConfirmacao!.toUpperCase()
    : true;

  const handleConfirm = () => {
    if (isConfirmacaoCorreta) {
      // Limpa a palavra digitada para a próxima abertura do modal
      setInputValue("");
      onConfirm();
    }
  };

  const handleClose = () => {
    if (loading) return;
    setInputValue("");
    onClose();
  };

  const botaoTexto = textoBotaoConfirmar || textoBotao;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titulo}
      size="sm"
      loading={loading}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            // Ação destrutiva = perigo; aviso (ex.: Sair) = ação comum
            variant={variante === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={!isConfirmacaoCorreta || loading}
            loading={loading}
          >
            {loading ? "Processando..." : botaoTexto}
          </Button>
        </>
      }
    >
      <Message>{mensagem}</Message>

      {exigeDigitacao && (
        <InputSection>
          <Label htmlFor={inputId}>
            Para confirmar, digite{" "}
            <RequiredWord>{palavraConfirmacao}</RequiredWord>
          </Label>
          <Input
            id={inputId}
            type="text"
            fullWidth
            autoComplete="off"
            autoCapitalize="characters"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Digite "${palavraConfirmacao}"`}
            disabled={loading}
            autoFocus
          />
          {inputValue && !isConfirmacaoCorreta && (
            <ValidationMessage $isValid={false}>Texto incorreto</ValidationMessage>
          )}
          {isConfirmacaoCorreta && inputValue && (
            <ValidationMessage $isValid={true}>Texto correto</ValidationMessage>
          )}
        </InputSection>
      )}
    </Modal>
  );
};

export default ConfirmacaoPerigosa;
