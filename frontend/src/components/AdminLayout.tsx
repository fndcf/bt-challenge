/**
 * AdminLayout - VERSÃO FINAL
 * Adiciona classe "admin-area" no body para isolar estilos
 */

import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useArena } from "../contexts/ArenaContext";

// ===========================
// LAYOUT PRINCIPAL
// ===========================

const Layout = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
`;

// ===========================
// SIDEBAR
// ===========================

const Sidebar = styled.aside<{ $open: boolean }>`
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: ${(props) => (props.$open ? "260px" : "70px")};
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    z-index: 1000;
    transform: ${(props) =>
      props.$open ? "translateX(0)" : "translateX(-100%)"};
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Logo = styled.div`
  font-size: 2rem;
`;

const LogoText = styled.span<{ $show: boolean }>`
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  width: ${(props) => (props.$show ? "auto" : 0)};
  overflow: hidden;
  transition: all 0.3s;
`;

const Nav = styled.nav`
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
`;

const NavLink = styled(Link)<{ $active: boolean; $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  padding-left: ${(props) => (props.$open ? "1.5rem" : "1rem")};
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid ${(props) => (props.$active ? "white" : "transparent")};
  background: ${(props) =>
    props.$active ? "rgba(255, 255, 255, 0.1)" : "transparent"};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  span:first-child {
    font-size: 1.5rem;
    width: 24px;
    text-align: center;
  }

  span:last-child {
    opacity: ${(props) => (props.$open ? 1 : 0)};
    width: ${(props) => (props.$open ? "auto" : 0)};
    overflow: hidden;
    white-space: nowrap;
  }
`;

const NavButton = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  padding-left: ${(props) => (props.$open ? "1.5rem" : "1rem")};
  color: rgba(255, 255, 255, 0.85);
  background: none;
  border: none;
  border-left: 3px solid transparent;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-family: inherit;

  &:hover {
    background: rgba(231, 76, 60, 0.2);
    color: white;
    border-left-color: #e74c3c;
  }

  span:first-child {
    font-size: 1.5rem;
    width: 24px;
    text-align: center;
  }

  span:last-child {
    opacity: ${(props) => (props.$open ? 1 : 0)};
    width: ${(props) => (props.$open ? "auto" : 0)};
    overflow: hidden;
    white-space: nowrap;
  }
`;

const SidebarFooter = styled.div<{ $open: boolean }>`
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  ${(props) =>
    !props.$open &&
    `
    display: flex;
    justify-content: center;
  `}
`;

const UserCard = styled.div<{ $open: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: ${(props) => (props.$open ? "0.75rem" : "0.5rem")};
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span:first-child {
    font-size: 1.5rem;
  }
`;

const UserInfo = styled.div<{ $show: boolean }>`
  opacity: ${(props) => (props.$show ? 1 : 0)};
  width: ${(props) => (props.$show ? "auto" : 0)};
  overflow: hidden;
  transition: all 0.3s;

  p {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
  }

  small {
    font-size: 0.75rem;
    opacity: 0.8;
  }
`;

// ===========================
// CONTEÚDO PRINCIPAL
// ===========================

const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem;
  background: #f5f7fa;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// ===========================
// CONTROLES MOBILE
// ===========================

const Overlay = styled.div<{ $show: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: ${(props) => (props.$show ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: -12px;
  width: 24px;
  height: 24px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const MenuButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 56px;
    height: 56px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    z-index: 998;
    transition: all 0.2s;

    &:active {
      transform: scale(0.9);
    }
  }
`;

// ===========================
// COMPONENTE
// ===========================

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { arena } = useArena();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 768 : true
  );

  // ⭐ ADICIONA classe "admin-area" no body ao montar
  useEffect(() => {
    document.body.classList.add("admin-area");

    // Remove ao desmontar
    return () => {
      document.body.classList.remove("admin-area");
    };
  }, []);

  // Fecha sidebar ao mudar de rota em mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: "/admin", icon: "📊", label: "Dashboard", exact: true },
    { path: "/admin/jogadores", icon: "👥", label: "Jogadores" },
    { path: "/admin/etapas", icon: "🏆", label: "Challenges" },
    { path: "/admin/ranking", icon: "📈", label: "Ranking" },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      logout();
    }
  };

  return (
    <Layout>
      <Overlay $show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
        <ToggleButton onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "←" : "→"}
        </ToggleButton>

        <SidebarHeader>
          <Logo>🎾</Logo>
          <LogoText $show={sidebarOpen}>Challenge BT</LogoText>
        </SidebarHeader>

        <Nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $active={isActive(item.path, item.exact)}
              $open={sidebarOpen}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <hr
            style={{
              margin: "1rem 0",
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          />

          {arena && (
            <NavLink
              to={`/arena/${arena.slug}`}
              target="_blank"
              $active={false}
              $open={sidebarOpen}
            >
              <span>👁️</span>
              <span>Ver Página Pública</span>
            </NavLink>
          )}

          <NavButton $open={sidebarOpen} onClick={handleLogout}>
            <span>🚪</span>
            <span>Sair</span>
          </NavButton>
        </Nav>

        <SidebarFooter $open={sidebarOpen}>
          <UserCard $open={sidebarOpen}>
            <span>👤</span>
            <UserInfo $show={sidebarOpen}>
              <p>{user?.email?.split("@")[0]}</p>
              <small>Administrador</small>
            </UserInfo>
          </UserCard>
        </SidebarFooter>
      </Sidebar>

      <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>☰</MenuButton>

      <Main>
        <Outlet />
      </Main>
    </Layout>
  );
};

export default AdminLayout;
