/**
 * Confrontos da eliminatória agrupados por fase (Dupla Fixa e Rei da Praia)
 */

import { Button, BadgeTom } from "@/components/ui";
import {
  CardConfronto,
  LadoConfronto,
  ConfrontosEliminatoria,
} from "@/components/torneio";
import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
  TipoFase,
} from "@/types/chave";
import { formatarLadoPlacarConfronto } from "@/utils/placarMelhorDe3";
import { contarStatus, getNomeFase } from "../utils/faseHelpers";
import {
  ByeBox,
  ByeLabel,
  ByeOrigin,
  ByeTeam,
  Conteudo,
  FaseCard,
  FaseHeader,
  FaseStatus,
  FaseTitle,
} from "../styles";

/** Campos usados na lista; atende os confrontos dos dois formatos */
export type ConfrontoDaLista = Pick<
  ConfrontoEliminatorio,
  | "id"
  | "ordem"
  | "status"
  | "dupla1Id"
  | "dupla1Nome"
  | "dupla1Origem"
  | "dupla2Id"
  | "dupla2Nome"
  | "dupla2Origem"
  | "placar"
  | "vencedoraId"
>;

interface ListaConfrontosEliminatoriosProps<T extends ConfrontoDaLista> {
  fases: [string, T[]][];
  onSelecionar: (confronto: T) => void;
  etapaFinalizada: boolean;
}

const SITUACAO: Record<
  StatusConfrontoEliminatorio,
  { label: string; tom: BadgeTom }
> = {
  [StatusConfrontoEliminatorio.BYE]: { label: "BYE", tom: "neutro" },
  [StatusConfrontoEliminatorio.AGENDADA]: { label: "Aguardando", tom: "aviso" },
  [StatusConfrontoEliminatorio.FINALIZADA]: {
    label: "Finalizada",
    tom: "sucesso",
  },
};

const montarLado = (
  confronto: ConfrontoDaLista,
  numero: 1 | 2
): LadoConfronto => {
  const id = numero === 1 ? confronto.dupla1Id : confronto.dupla2Id;
  const nome = numero === 1 ? confronto.dupla1Nome : confronto.dupla2Nome;
  const origem = numero === 1 ? confronto.dupla1Origem : confronto.dupla2Origem;
  const finalizado =
    confronto.status === StatusConfrontoEliminatorio.FINALIZADA;

  return {
    nome: nome || "A definir",
    detalhe: origem ? `(${origem})` : undefined,
    placar:
      finalizado && confronto.placar
        ? formatarLadoPlacarConfronto(confronto.placar, numero)
        : undefined,
    vencedor: !!id && confronto.vencedoraId === id,
  };
};

export const ListaConfrontosEliminatorios = <T extends ConfrontoDaLista>({
  fases,
  onSelecionar,
  etapaFinalizada,
}: ListaConfrontosEliminatoriosProps<T>) => {
  const renderAcao = (confronto: T) => {
    if (confronto.status === StatusConfrontoEliminatorio.AGENDADA) {
      return (
        <Button fullWidth onClick={() => onSelecionar(confronto)}>
          Registrar Resultado
        </Button>
      );
    }

    return (
      <Button
        variant={etapaFinalizada ? "secondary" : "outline"}
        fullWidth
        onClick={() => onSelecionar(confronto)}
        disabled={etapaFinalizada}
      >
        {etapaFinalizada ? "Etapa Finalizada" : "Editar Resultado"}
      </Button>
    );
  };

  return (
    <Conteudo>
      {fases.map(([fase, confrontos]) => (
        <FaseCard key={fase}>
          <FaseHeader>
            <FaseTitle>{getNomeFase(fase as TipoFase)}</FaseTitle>
            <FaseStatus>{contarStatus(confrontos)} completos</FaseStatus>
          </FaseHeader>

          <ConfrontosEliminatoria>
            {confrontos.map((confronto) =>
              confronto.status === StatusConfrontoEliminatorio.BYE ? (
                <ByeBox key={confronto.id}>
                  <ByeTeam>{confronto.dupla1Nome}</ByeTeam>
                  <ByeOrigin>({confronto.dupla1Origem})</ByeOrigin>
                  <ByeLabel>Classificado automaticamente (BYE)</ByeLabel>
                </ByeBox>
              ) : (
                <CardConfronto
                  key={confronto.id}
                  titulo={`CONFRONTO ${confronto.ordem}`}
                  situacao={SITUACAO[confronto.status]}
                  lado1={montarLado(confronto, 1)}
                  lado2={montarLado(confronto, 2)}
                  acoes={renderAcao(confronto)}
                />
              )
            )}
          </ConfrontosEliminatoria>
        </FaseCard>
      ))}
    </Conteudo>
  );
};
