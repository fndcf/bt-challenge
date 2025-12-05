/**
 * Testes do componente Footer
 */

import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer/Footer";

describe("Footer", () => {
  describe("renderização", () => {
    it("deve renderizar o footer", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
    });

    it("deve mostrar o ano atual", () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    });

    it("deve mostrar o nome da empresa", () => {
      render(<Footer />);
      expect(screen.getByText(/Challenge BT/)).toBeInTheDocument();
    });

    it("deve mostrar FCF Solutions", () => {
      render(<Footer />);
      expect(screen.getByText(/FCF Solutions/)).toBeInTheDocument();
    });

    it("deve mostrar texto completo do copyright", () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(`© ${currentYear} Challenge BT - Powered by FCF Solutions`)
      ).toBeInTheDocument();
    });
  });
});
