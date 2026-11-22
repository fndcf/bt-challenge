import React, { useId } from "react";
import styled from "styled-components";
import { Alert, Badge, Button, Modal, Tabs } from "@/components/ui";
import { SeloGenero } from "@/components/jogadores/Genero";
import { GeneroJogador } from "@/types/jogador";
import { theme } from "@/styles/theme";
import { getNivelLabel } from "@/utils/formatters";
import { FormNovoJogador } from "./components/FormNovoJogador";
import { ListaJogadores } from "./components/ListaJogadores";
import {
  AbaInscricao,
  UseModalInscricaoParams,
  useModalInscricao,
} from "./hooks/useModalInscricao";

interface ModalInscricaoProps extends UseModalInscricaoParams {
  etapaNome: string;
}

// ============== STYLED COMPONENTS ==============

const { texto } = theme.semantic;
const { fontSize } = theme.typography;

const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Rodape = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${theme.spacing[3]};

  > span {
    flex: 1 1 100%;
    font-size: ${fontSize.sm};
    color: ${texto.secundario};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    > button {
      flex: 1;
    }
  }

  @media (min-width: ${theme.breakpoints.sm}) {
    > span {
      flex: 1;
    }
  }
`;

const ABAS: { id: AbaInscricao; label: string }[] = [
  { id: "selecionar", label: "Selecionar Jogadores" },
  { id: "cadastrar", label: "Cadastrar Novo" },
];

// ============== COMPONENTE ==============

export const ModalInscricao: React.FC<ModalInscricaoProps> = ({
  etapaNome,
  ...params
}) => {
  const { etapaNivel, etapaFormato, onClose } = params;
  const modal = useModalInscricao(params);
  const formId = useId();
  const { aba, setAba, loading, selecionados, totalPorGenero, maxPorGenero } =
    modal;

  const renderProporcao = (
    genero: GeneroJogador,
    rotulo: string,
    total: number
  ) => (
    <SeloGenero genero={genero}>
      {`${rotulo}: ${total}/${maxPorGenero}${
        total >= maxPorGenero ? " (completo)" : ""
      }`}
    </SeloGenero>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Inscrever Jogadores"
      subtitle={etapaNome}
      size="lg"
      loading={loading}
      footer={
        <Rodape>
          {modal.successMessage && (
            <Alert variant="success">{modal.successMessage}</Alert>
          )}
          {aba === "selecionar" && modal.aviso && (
            <div role="alert">
              <Alert variant="warning">{modal.aviso}</Alert>
            </div>
          )}
          {modal.error && (
            <div role="alert">
              <Alert variant="error">{modal.error}</Alert>
            </div>
          )}
          <Acoes>
            {aba === "selecionar" && selecionados.length > 0 && (
              <span>
                {selecionados.length} de {modal.vagasDisponiveis} vaga(s)
                selecionada(s)
              </span>
            )}
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            {aba === "cadastrar" && (
              // Fora do <form> para ficar fixo no rodapé
              <Button
                type="submit"
                form={formId}
                disabled={loading || !modal.novoJogador.nome.trim()}
              >
                {loading ? "Cadastrando..." : "Cadastrar Jogador"}
              </Button>
            )}
            {aba === "selecionar" && (
              <Button
                onClick={modal.inscrever}
                disabled={loading || selecionados.length === 0}
              >
                {loading ? "Inscrevendo..." : "Inscrever"}
              </Button>
            )}
          </Acoes>
        </Rodape>
      }
    >
      <Conteudo>
        <Selos>
          {etapaNivel && <Badge>Nível: {getNivelLabel(etapaNivel)}</Badge>}
          <Badge>Vagas: {modal.vagasDisponiveis}</Badge>
          <Badge>
            Disponíveis: {modal.jogadoresDisponiveis.length} de{" "}
            {modal.jogadores.length}
          </Badge>
        </Selos>

        {modal.exigeProporcao && (
          <Selos>
            <span>Proporção de gênero (50%/50%):</span>
            {renderProporcao(
              GeneroJogador.MASCULINO,
              "Masc",
              totalPorGenero.masculino
            )}
            {renderProporcao(
              GeneroJogador.FEMININO,
              "Fem",
              totalPorGenero.feminino
            )}
          </Selos>
        )}

        <Tabs
          rotulo="Inscrição"
          abas={ABAS}
          ativa={aba}
          onChange={setAba}
          formato={etapaFormato}
        />

        {aba === "selecionar" ? (
          <ListaJogadores
            busca={modal.busca}
            onBuscar={modal.setBusca}
            carregando={modal.loadingJogadores}
            jogadores={modal.jogadoresFiltrados}
            totalCadastrados={modal.jogadores.length}
            disponiveis={modal.jogadoresDisponiveis}
            filtroGenero={modal.filtroGenero}
            onFiltrarGenero={modal.setFiltroGenero}
            etapaNivel={etapaNivel}
            isMisto={modal.isMisto}
            estaSelecionado={modal.estaSelecionado}
            onToggle={modal.toggleJogador}
            onCadastrar={() => setAba("cadastrar")}
          />
        ) : (
          <FormNovoJogador
            id={formId}
            jogador={modal.novoJogador}
            onChange={modal.setNovoJogador}
            onCadastrar={modal.cadastrarJogador}
            escolheGenero={modal.isMisto}
            escolheNivel={!etapaNivel}
          />
        )}
      </Conteudo>
    </Modal>
  );
};

export default ModalInscricao;
