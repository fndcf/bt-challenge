import styled from "styled-components";

/**
 * Styles específicos do Rei da Praia
 */

export const Header = styled.div`
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  color: white;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: #ede9fe;
    margin: 0;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

export const ChaveamentoInfo = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span:first-child {
    font-weight: 600;
    font-size: 0.875rem;
  }

  span:last-child {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 700;
  }
`;

// Re-exportar todos os outros styles de FaseEliminatoria
export * from "../FaseEliminatoria/styles";
