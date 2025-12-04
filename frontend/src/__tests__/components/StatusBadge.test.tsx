/**
 * Testes do componente StatusBadge
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/etapas/StatusBadge";
import { StatusEtapa } from "@/types/etapa";

describe("StatusBadge", () => {
  describe("renderização", () => {
    it("deve renderizar com status INSCRICOES_ABERTAS", () => {
      render(<StatusBadge status={StatusEtapa.INSCRICOES_ABERTAS} />);

      expect(screen.getByText("Inscrições Abertas")).toBeInTheDocument();
    });

    it("deve renderizar com status INSCRICOES_ENCERRADAS", () => {
      render(<StatusBadge status={StatusEtapa.INSCRICOES_ENCERRADAS} />);

      expect(screen.getByText("Inscrições Encerradas")).toBeInTheDocument();
    });

    it("deve renderizar com status CHAVES_GERADAS", () => {
      render(<StatusBadge status={StatusEtapa.CHAVES_GERADAS} />);

      expect(screen.getByText("Chaves Geradas")).toBeInTheDocument();
    });

    it("deve renderizar com status EM_ANDAMENTO", () => {
      render(<StatusBadge status={StatusEtapa.EM_ANDAMENTO} />);

      expect(screen.getByText("Em Andamento")).toBeInTheDocument();
    });

    it("deve renderizar com status FINALIZADA", () => {
      render(<StatusBadge status={StatusEtapa.FINALIZADA} />);

      expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("deve renderizar com status CANCELADA", () => {
      render(<StatusBadge status={StatusEtapa.CANCELADA} />);

      expect(screen.getByText("Cancelada")).toBeInTheDocument();
    });

    it("deve renderizar com status FASE_ELIMINATORIA", () => {
      render(<StatusBadge status={StatusEtapa.FASE_ELIMINATORIA} />);

      expect(screen.getByText("Fase Eliminatória")).toBeInTheDocument();
    });
  });

  describe("props", () => {
    it("deve aceitar className customizada", () => {
      const { container } = render(
        <StatusBadge
          status={StatusEtapa.INSCRICOES_ABERTAS}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("todos os status", () => {
    const statusList = [
      { status: StatusEtapa.INSCRICOES_ABERTAS, label: "Inscrições Abertas" },
      {
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        label: "Inscrições Encerradas",
      },
      { status: StatusEtapa.CHAVES_GERADAS, label: "Chaves Geradas" },
      { status: StatusEtapa.EM_ANDAMENTO, label: "Em Andamento" },
      { status: StatusEtapa.FINALIZADA, label: "Finalizada" },
      { status: StatusEtapa.CANCELADA, label: "Cancelada" },
      { status: StatusEtapa.FASE_ELIMINATORIA, label: "Fase Eliminatória" },
    ];

    it.each(statusList)(
      "deve renderizar corretamente o status $status",
      ({ status, label }) => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    );
  });
});
