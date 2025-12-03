import { styled } from "styled-components";

const FooterContainer = styled.footer`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  margin-top: 4rem;
  padding: 2rem 1rem;
  text-align: center;
  color: black;

  p {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.9;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <p>
        © {new Date().getFullYear()} Challenge BT - Powered by FCF Solutions
      </p>
    </FooterContainer>
  );
}
