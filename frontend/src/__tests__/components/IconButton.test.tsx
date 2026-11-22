/**
 * Testes do IconButton e dos textos do Teams
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { IconButton } from "@/components/ui";
import { VarianteTeams, StatusConfronto } from "@/types/teams";
import {
  getSituacaoConfronto,
  getTipoJogoLabel,
  getVarianteTeamsInfo,
  equipeVenceu,
  precisaDecider,
} from "@/utils/teams";

describe("IconButton", () => {
  it("deve usar o rótulo como nome acessível e dica", () => {
    const onClick = jest.fn();
    render(<IconButton rotulo="Renomear" icone={<svg />} onClick={onClick} />);

    const botao = screen.getByRole("button", { name: "Renomear" });
    expect(botao).toHaveAttribute("title", "Renomear");
    expect(botao).toHaveAttribute("type", "button");

    fireEvent.click(botao);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("deve respeitar o disabled e uma dica diferente do nome", () => {
    render(
      <IconButton
        rotulo="Remover Ana"
        title="Remover jogador"
        tom="perigo"
        icone={<svg />}
        disabled
      />
    );

    const botao = screen.getByRole("button", { name: "Remover Ana" });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("title", "Remover jogador");
  });
});

describe("utils/teams", () => {
  const confronto: any = {
    jogosEquipe1: 1,
    jogosEquipe2: 1,
    status: StatusConfronto.EM_ANDAMENTO,
    temDecider: false,
  };

  it("deve pedir decider só no TEAMS 4 empatado em 1 a 1", () => {
    const { TEAMS_4, TEAMS_6 } = VarianteTeams;

    expect(precisaDecider(confronto, TEAMS_4)).toBe(true);
    expect(precisaDecider(confronto, TEAMS_6)).toBe(false);
    expect(precisaDecider({ ...confronto, temDecider: true }, TEAMS_4)).toBe(
      false
    );
    expect(precisaDecider({ ...confronto, jogosEquipe2: 0 }, TEAMS_4)).toBe(
      false
    );
    expect(
      precisaDecider(
        { ...confronto, status: StatusConfronto.FINALIZADO },
        TEAMS_4
      )
    ).toBe(false);
  });

  it("deve definir a situação pelos jogos contados, não só pelo status", () => {
    const { AGENDADO, EM_ANDAMENTO, FINALIZADO } = StatusConfronto;
    const situacao = (status: string, jogosEquipe1 = 0, jogosEquipe2 = 0) =>
      getSituacaoConfronto({ status, jogosEquipe1, jogosEquipe2 }).label;

    expect(situacao(AGENDADO)).toBe("Aguardando");
    expect(situacao(AGENDADO, 1, 1)).toBe("Em andamento");
    expect(situacao(EM_ANDAMENTO)).toBe("Em andamento");
    expect(situacao(FINALIZADO, 2, 0)).toBe("Finalizado");
    // A página pública pode receber em maiúsculas
    expect(situacao("FINALIZADO", 2, 0)).toBe("Finalizado");
  });

  it("deve ignorar o vencedor de confronto que não terminou", () => {
    const base = { vencedoraId: "e1", jogosEquipe1: 1, jogosEquipe2: 1 };
    const { EM_ANDAMENTO, FINALIZADO } = StatusConfronto;

    expect(equipeVenceu({ ...base, status: EM_ANDAMENTO }, "e1")).toBe(false);
    expect(equipeVenceu({ ...base, status: FINALIZADO }, "e1")).toBe(true);
    expect(equipeVenceu({ ...base, status: FINALIZADO }, "e2")).toBe(false);
    expect(equipeVenceu({ status: FINALIZADO }, undefined)).toBe(false);
  });

  it("deve descrever variante, situação e tipo de jogo", () => {
    expect(getVarianteTeamsInfo(VarianteTeams.TEAMS_6)).toEqual({
      nome: "TEAMS 6",
      jogadoresPorEquipe: 6,
      jogosPorConfronto: 3,
    });
    expect(getVarianteTeamsInfo().nome).toBe("TEAMS");
    expect(getTipoJogoLabel("misto")).toBe("MISTO");
    expect(getTipoJogoLabel("outro")).toBe("OUTRO");
  });
});
