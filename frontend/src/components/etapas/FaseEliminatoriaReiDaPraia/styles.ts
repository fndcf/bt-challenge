import styled from "styled-components";

/**
 * Styles específicos do Rei da Praia
 */

export const Header = styled.div`
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-radius: 0.375rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 1rem;
  color: white;

  h2 {
    font-size: 0.9375rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.375rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }

  p {
    color: #ede9fe;
    margin: 0;
    font-size: 0.75rem;

    @media (min-width: 768px) {
      font-size: 0.8125rem;
    }
  }
`;

export const ChaveamentoInfo = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  padding: 0.375rem 0.625rem;
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  span:first-child {
    font-weight: 600;
    font-size: 0.6875rem;
  }

  span:last-child {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 700;
  }
`;

// Re-exportar todos os outros styles de FaseEliminatoria
export * from "../FaseEliminatoria/styles";
