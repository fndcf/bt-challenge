/**
 * Testes do componente ScrollToTop
 */

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ScrollToTop from "@/components/utils/ScrollToTop/ScrollToTop";

// Mock do window.scrollTo
const mockScrollTo = jest.fn();
Object.defineProperty(window, "scrollTo", {
  value: mockScrollTo,
  writable: true,
});

// Mock do window.getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;

describe("ScrollToTop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.getComputedStyle = originalGetComputedStyle;
  });

  it("deve chamar window.scrollTo(0, 0) ao montar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("deve chamar window.scrollTo(0, 0) em rotas diferentes", () => {
    // Primeira rota
    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledTimes(1);
    unmount();

    // Segunda rota - simula navegação para outra página
    render(
      <MemoryRouter initialEntries={["/outra-pagina"]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledTimes(2);
  });

  it("não deve renderizar nada visualmente", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it("deve resetar scrollTop de elementos main", () => {
    // Cria um elemento main com scroll
    const mainElement = document.createElement("main");
    mainElement.scrollTop = 500;
    document.body.appendChild(mainElement);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mainElement.scrollTop).toBe(0);

    // Cleanup
    document.body.removeChild(mainElement);
  });

  it("deve resetar scrollTop de elementos com overflow-y auto", () => {
    // Cria um elemento com overflow
    const scrollableDiv = document.createElement("div");
    scrollableDiv.style.overflowY = "auto";
    scrollableDiv.scrollTop = 300;
    document.body.appendChild(scrollableDiv);

    // Mock getComputedStyle para retornar overflow-y: auto
    window.getComputedStyle = jest.fn().mockReturnValue({
      overflowY: "auto",
      overflow: "",
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(scrollableDiv.scrollTop).toBe(0);

    // Cleanup
    document.body.removeChild(scrollableDiv);
  });
});
