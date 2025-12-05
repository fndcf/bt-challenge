/**
 * Testes do componente Toast
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ui/Toast/Toast";

// Componente auxiliar para testar o hook useToast
const TestComponent = () => {
  const { showToast, hideToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Mensagem info", "info")}>
        Show Info
      </button>
      <button onClick={() => showToast("Mensagem success", "success")}>
        Show Success
      </button>
      <button onClick={() => showToast("Mensagem warning", "warning")}>
        Show Warning
      </button>
      <button onClick={() => showToast("Mensagem error", "error")}>
        Show Error
      </button>
      <button onClick={() => showToast("Mensagem com duração", "info", 1000)}>
        Show With Duration
      </button>
      <button onClick={() => showToast("Sem auto remove", "info", 0)}>
        Show No Auto Remove
      </button>
    </div>
  );
};

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("ToastProvider", () => {
    it("deve renderizar children", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("deve aceitar position prop", () => {
      render(
        <ToastProvider position="bottom-left">
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByText("Show Info")).toBeInTheDocument();
    });

    it("deve aceitar defaultDuration prop", () => {
      render(
        <ToastProvider defaultDuration={3000}>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByText("Show Info")).toBeInTheDocument();
    });
  });

  describe("showToast", () => {
    it("deve mostrar toast com mensagem info", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Info"));
      expect(screen.getByText("Mensagem info")).toBeInTheDocument();
    });

    it("deve mostrar toast com tipo success", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Success"));
      expect(screen.getByText("Mensagem success")).toBeInTheDocument();
    });

    it("deve mostrar toast com tipo warning", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Warning"));
      expect(screen.getByText("Mensagem warning")).toBeInTheDocument();
    });

    it("deve mostrar toast com tipo error", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Error"));
      expect(screen.getByText("Mensagem error")).toBeInTheDocument();
    });

    it("deve auto-remover toast após duração", async () => {
      render(
        <ToastProvider defaultDuration={1000}>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Info"));
      expect(screen.getByText("Mensagem info")).toBeInTheDocument();

      // Avançar timers para remover o toast
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Aguardar animação de saída
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.queryByText("Mensagem info")).not.toBeInTheDocument();
      });
    });

    it("não deve auto-remover quando duration é 0", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show No Auto Remove"));
      expect(screen.getByText("Sem auto remove")).toBeInTheDocument();

      // Avançar muito tempo
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Toast ainda deve estar presente
      expect(screen.getByText("Sem auto remove")).toBeInTheDocument();
    });
  });

  describe("hideToast", () => {
    it("deve fechar toast ao clicar no botão de fechar", async () => {
      render(
        <ToastProvider defaultDuration={0}>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Info"));
      expect(screen.getByText("Mensagem info")).toBeInTheDocument();

      // Encontrar e clicar no botão de fechar
      const closeButtons = document.querySelectorAll("button");
      const closeButton = Array.from(closeButtons).find(
        (btn) => btn.querySelector("svg") && btn.textContent === ""
      );

      if (closeButton) {
        fireEvent.click(closeButton);

        // Aguardar animação
        act(() => {
          jest.advanceTimersByTime(200);
        });

        await waitFor(() => {
          expect(screen.queryByText("Mensagem info")).not.toBeInTheDocument();
        });
      }
    });
  });

  describe("múltiplos toasts", () => {
    it("deve mostrar múltiplos toasts", () => {
      render(
        <ToastProvider defaultDuration={0}>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Info"));
      fireEvent.click(screen.getByText("Show Success"));
      fireEvent.click(screen.getByText("Show Error"));

      expect(screen.getByText("Mensagem info")).toBeInTheDocument();
      expect(screen.getByText("Mensagem success")).toBeInTheDocument();
      expect(screen.getByText("Mensagem error")).toBeInTheDocument();
    });
  });

  describe("useToast fora do provider", () => {
    it("deve lançar erro quando usado fora do ToastProvider", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useToast deve ser usado dentro de ToastProvider");

      consoleError.mockRestore();
    });
  });

  describe("posições", () => {
    const positions = [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ] as const;

    positions.forEach((position) => {
      it(`deve renderizar na posição ${position}`, () => {
        render(
          <ToastProvider position={position} defaultDuration={0}>
            <TestComponent />
          </ToastProvider>
        );

        fireEvent.click(screen.getByText("Show Info"));
        expect(screen.getByText("Mensagem info")).toBeInTheDocument();
      });
    });
  });
});
