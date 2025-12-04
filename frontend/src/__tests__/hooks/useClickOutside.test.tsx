/**
 * Testes do hook useClickOutside
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useClickOutside } from "@/hooks/useClickOutside";

// Componente de teste que usa o hook
const TestComponent: React.FC<{ onClickOutside: () => void }> = ({
  onClickOutside,
}) => {
  const ref = useClickOutside<HTMLDivElement>(onClickOutside);

  return (
    <div>
      <div ref={ref} data-testid="inside">
        Dentro do elemento
      </div>
      <div data-testid="outside">Fora do elemento</div>
    </div>
  );
};

describe("useClickOutside", () => {
  it("deve chamar callback quando clicar fora do elemento", () => {
    const handleClickOutside = jest.fn();

    render(<TestComponent onClickOutside={handleClickOutside} />);

    // Clicar fora
    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it("não deve chamar callback quando clicar dentro do elemento", () => {
    const handleClickOutside = jest.fn();

    render(<TestComponent onClickOutside={handleClickOutside} />);

    // Clicar dentro
    fireEvent.mouseDown(screen.getByTestId("inside"));

    expect(handleClickOutside).not.toHaveBeenCalled();
  });

  it("deve remover event listener ao desmontar", () => {
    const handleClickOutside = jest.fn();
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <TestComponent onClickOutside={handleClickOutside} />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it("deve adicionar event listener ao montar", () => {
    const handleClickOutside = jest.fn();
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    render(<TestComponent onClickOutside={handleClickOutside} />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });
});
