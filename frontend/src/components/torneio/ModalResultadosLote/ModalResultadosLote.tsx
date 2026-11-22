/**
 * Moldura dos modais de resultados em lote: título, conteúdo rolável e rodapé
 * fixo com o resumo, o erro geral e os botões.
 */

import React, { useId } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { Alert, Button, LoadingOverlay, Modal } from "@/components/ui";

const { texto } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface ModalResultadosLoteProps {
  /** Complemento do título: "Registrar Resultados - {contexto}" */
  contexto: string;
  totalPartidas: number;
  jaFinalizadas: number;
  seraoSalvas: number;
  /** Itens extras do resumo (ex.: partidas sem jogadores) */
  resumoExtra?: { rotulo: string; valor: number }[];
  erroGlobal?: string | null;
  loading?: boolean;
  etapaFinalizada?: boolean;
  closeOnEscape?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const Rodape = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

const Resumo = styled.dl`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${theme.spacing[1]} ${theme.spacing[6]};
  margin: 0;
`;

const ResumoItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${theme.spacing[1]};
  font-size: ${fontSize.sm};

  dt {
    color: ${texto.secundario};
  }

  dd {
    margin: 0;
    color: ${texto.principal};
    font-weight: ${fontWeight.bold};
  }
`;

const Botoes = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing[3]};

  @media (max-width: ${theme.breakpoints.sm}) {
    > * {
      flex: 1;
    }
  }
`;

export const ModalResultadosLote: React.FC<ModalResultadosLoteProps> = ({
  contexto,
  totalPartidas,
  jaFinalizadas,
  seraoSalvas,
  resumoExtra = [],
  erroGlobal,
  loading = false,
  etapaFinalizada = false,
  closeOnEscape = true,
  onClose,
  onSubmit,
  children,
}) => {
  const formId = useId();

  const textoSalvar = () => {
    if (etapaFinalizada) return "Etapa Finalizada";
    if (loading) return "Salvando...";
    return `Salvar Resultados (${seraoSalvas})`;
  };

  const resumo = [
    { rotulo: "Total de Partidas", valor: totalPartidas },
    { rotulo: "Já Finalizadas", valor: jaFinalizadas },
    { rotulo: "Serão Salvas", valor: seraoSalvas },
    ...resumoExtra,
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Registrar Resultados - ${contexto}`}
      subtitle="Apenas os resultados preenchidos serão salvos."
      size="md"
      loading={loading}
      closeOnEscape={closeOnEscape}
      footer={
        <Rodape>
          {erroGlobal && (
            <div role="alert">
              <Alert variant="error">{erroGlobal}</Alert>
            </div>
          )}
          <Resumo>
            {resumo.map(({ rotulo, valor }) => (
              <ResumoItem key={rotulo}>
                <dt>{rotulo}</dt>
                <dd>{valor}</dd>
              </ResumoItem>
            ))}
          </Resumo>
          <Botoes>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            {/* Fora do <form> para ficar fixo no rodapé */}
            <Button
              type="submit"
              form={formId}
              disabled={loading || etapaFinalizada}
              loading={loading}
            >
              {textoSalvar()}
            </Button>
          </Botoes>
        </Rodape>
      }
    >
      <form id={formId} onSubmit={onSubmit}>
        {children}
      </form>

      <LoadingOverlay isLoading={loading} message="Salvando resultados..." />
    </Modal>
  );
};

export default ModalResultadosLote;
