import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que reseta a posição do scroll para o topo
 * sempre que a rota muda.
 *
 * Funciona tanto para scroll no window quanto para
 * containers com overflow-y: auto (como o AdminLayout).
 *
 * Deve ser colocado dentro do BrowserRouter.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll do window (páginas públicas)
    window.scrollTo(0, 0);

    // Scroll de containers com overflow (área admin)
    // Busca elementos main e elementos com overflow-y auto/scroll
    const scrollableElements = document.querySelectorAll(
      'main, [style*="overflow"], [class*="overflow"]'
    );

    scrollableElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        if (
          style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflow === "auto" ||
          style.overflow === "scroll"
        ) {
          el.scrollTop = 0;
        }
      }
    });

    // Também busca o elemento main diretamente
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
