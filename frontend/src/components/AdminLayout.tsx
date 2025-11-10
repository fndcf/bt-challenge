import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useArena } from "../contexts/ArenaContext";
import "./AdminLayout.css";

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { arena } = useArena();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    {
      path: "/admin",
      icon: "📊",
      label: "Dashboard",
      exact: true,
    },
    {
      path: "/admin/jogadores",
      icon: "👥",
      label: "Jogadores",
    },
    {
      path: "/admin/etapas",
      icon: "🏆",
      label: "Challenges",
    },
    {
      path: "/admin/ranking",
      icon: "📈",
      label: "Ranking",
    },
    {
      path: "/admin/configuracoes",
      icon: "⚙️",
      label: "Configurações",
    },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🎾</span>
            {sidebarOpen && <span className="logo-text">Challenge BT</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                isActive(item.path, item.exact) ? "active" : ""
              }`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {arena && sidebarOpen && (
            <div className="arena-info">
              <div className="arena-name">{arena.nome}</div>
              <div className="arena-slug">/{arena.slug}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? "←" : "→"}
          </button>

          <div className="header-title">
            <h1>Painel Administrativo</h1>
          </div>

          <div className="header-actions">
            <Link
              to={arena ? `/arena/${arena.slug}` : "/"}
              className="btn-view-public"
              target="_blank"
            >
              <span>👁️</span>
              <span className="btn-text">Ver Página Pública</span>
            </Link>

            <div className="user-menu">
              <div className="user-info">
                <span className="user-icon">👤</span>
                <div className="user-details">
                  <span className="user-name">
                    {user?.email?.split("@")[0]}
                  </span>
                  <span className="user-role">Admin</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-logout"
                title="Sair"
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
