import React, { useEffect, useId, useState } from "react";
import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
} from "@/types/chave";
import { getChaveService } from "@/services";
import { Modal, Button } from "@/components/ui";
import { CampoPlacar } from "@/components/torneio";
import { CampoSet, ChaveSet } from "@/utils/resultadosLote";
import {
  SetScore,
  venceuSet,
  setVazio,
  deveExibirTerceiroSet,
  validarSet,
  montarPlacarFinal,
  parsePlacarConfronto,
} from "@/utils/placarMelhorDe3";

interface ModalRegistrarResultadoEliminatorioProps {
  confronto: ConfrontoEliminatorio;
  melhorDe3?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============== COMPONENTE ==============

export const ModalRegistrarResultadoEliminatorio: React.FC<
  ModalRegistrarResultadoEliminatorioProps
> = ({ confronto, melhorDe3 = false, onClose, onSuccess }) => {
  const chaveService = getChaveService();
  const formId = useId();
  const isEdicao = confronto.status === StatusConfrontoEliminatorio.FINALIZADA;

  const [set1, setSet1] = useState<SetScore>({});
  const [set2, setSet2] = useState<SetScore>({});
  const [set3, setSet3] = useState<SetScore>({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isEdicao && confronto.placar) {
      const sets = parsePlacarConfronto(confronto.placar);
      setSet1(sets[0] || {});
      setSet2(sets[1] || {});
      setSet3(sets[2] || {});
    }
  }, [isEdicao, confronto.placar]);

  const alterarPlacar = (
    chave: ChaveSet,
    campo: CampoSet,
    valor: number | undefined
  ) => {
    const setSet = { set1: setSet1, set2: setSet2, set3: setSet3 }[chave];
    setSet((prev) => ({ ...prev, [campo]: valor }));
  };

  const calcularVencedor = (): { vencedor: string; placar: string } | null => {
    const formatarSet = (set: SetScore) => `${set.gamesDupla1} x ${set.gamesDupla2}`;

    const vencedorSet1 = venceuSet(set1);
    if (vencedorSet1 === undefined) return null;

    if (!melhorDe3) {
      return {
        vencedor: vencedorSet1 === 1 ? confronto.dupla1Nome! : confronto.dupla2Nome!,
        placar: formatarSet(set1),
      };
    }

    const vencedorSet2 = venceuSet(set2);
    if (vencedorSet2 === undefined) return null;

    if (vencedorSet1 === vencedorSet2) {
      return {
        vencedor: vencedorSet1 === 1 ? confronto.dupla1Nome! : confronto.dupla2Nome!,
        placar: `${formatarSet(set1)}, ${formatarSet(set2)}`,
      };
    }

    const vencedorSet3 = venceuSet(set3);
    if (vencedorSet3 === undefined) return null;

    return {
      vencedor: vencedorSet3 === 1 ? confronto.dupla1Nome! : confronto.dupla2Nome!,
      placar: `${formatarSet(set1)}, ${formatarSet(set2)}, ${formatarSet(set3)}`,
    };
  };

  const validarPlacar = (): boolean => {
    if (setVazio(set1)) {
      setErro("O placar deve ser preenchido");
      return false;
    }

    const erroSet1 = validarSet(set1, true);
    if (erroSet1) {
      setErro(erroSet1);
      return false;
    }

    if (!melhorDe3) return true;

    const erroSet2 = validarSet(set2, true);
    if (erroSet2) {
      setErro(`Set 2: ${erroSet2}`);
      return false;
    }

    if (deveExibirTerceiroSet(set1, set2)) {
      const erroSet3 = validarSet(set3, true);
      if (erroSet3) {
        setErro(`Set 3 (desempate): ${erroSet3}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!validarPlacar()) {
      return;
    }

    try {
      setLoading(true);

      const sets = melhorDe3
        ? deveExibirTerceiroSet(set1, set2)
          ? [set1, set2, set3]
          : [set1, set2]
        : [set1];

      await chaveService.registrarResultadoEliminatorio(
        confronto.id,
        montarPlacarFinal(sets)
      );
      alert(
        isEdicao
          ? " Resultado atualizado com sucesso!"
          : " Resultado registrado com sucesso!"
      );
      onSuccess();
    } catch (err: any) {
      setErro(
        err.message ||
          `Erro ao ${isEdicao ? "atualizar" : "registrar"} resultado`
      );
    } finally {
      setLoading(false);
    }
  };

  const resultado = calcularVencedor();

  const textoSalvar = () => {
    if (loading) return isEdicao ? "Atualizando..." : "Salvando...";
    return isEdicao ? "Atualizar Resultado" : "Salvar Resultado";
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdicao ? "Editar Resultado" : "Registrar Resultado"}
      subtitle={
        <>
          <strong>Confronto Eliminatório</strong>
          <div>
            {confronto.dupla1Origem} vs {confronto.dupla2Origem}
          </div>
        </>
      }
      size="md"
      loading={loading}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={loading || !resultado}
            loading={loading}
          >
            {textoSalvar()}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <CampoPlacar
          titulo={melhorDe3 ? "Placar (melhor de 3 sets)" : "Placar do Set"}
          lado1={{ nome: confronto.dupla1Nome || "A definir" }}
          lado2={{ nome: confronto.dupla2Nome || "A definir" }}
          placar={{ set1, set2, set3 }}
          melhorDe3={melhorDe3}
          onChange={alterarPlacar}
          disabled={loading}
          obrigatorio
          erro={erro ?? undefined}
        />
      </form>
    </Modal>
  );
};

export default ModalRegistrarResultadoEliminatorio;
