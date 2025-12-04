import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ArenaProvider } from "./contexts/ArenaContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterArena from "./pages/RegisterArena";
import RecuperarSenha from "./pages/RecuperarSenha";
import Dashboard from "./pages/Dashboard";
import Jogadores from "./pages/Jogadores";
import NovoJogador from "./pages/NovoJogador";
import EditarJogador from "./pages/EditarJogador";
import JogadorPerfil from "./pages/JogadorPerfil";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import "./config/firebase"; // Inicializar Firebase
import { ToastProvider } from "./components/ui";

// Pages - Etapas
import { ListagemEtapas } from "./pages/ListagemEtapas";
import { CriarEtapa } from "./pages/CriarEtapa";
import { EditarEtapa } from "./pages/EditarEtapa";
import DetalhesEtapa from "./pages/DetalhesEtapa";

// Pages - Arena Pública
import ArenaPublica from "./pages/ArenaPublica";
import EtapaDetalhe from "./pages/EtapaDetalhe";

function App() {
  return (
    <ToastProvider position="top-right">
      {" "}
      {/* ← Adicionar */}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <ArenaProvider>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterArena />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Rotas de Arena Pública */}
              <Route path="/arena/:slug" element={<ArenaPublica />} />
              <Route
                path="/arena/:slug/etapa/:etapaId"
                element={<EtapaDetalhe />}
              />
              <Route
                path="/arena/:slug/jogador/:jogadorId"
                element={<JogadorPerfil />}
              />

              {/* Rotas Administrativas Protegidas */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute requireAdmin>
                    <AdminLayout />
                  </PrivateRoute>
                }
              >
                {/* Rotas filhas do AdminLayout */}
                <Route index element={<Dashboard />} />
                <Route path="jogadores" element={<Jogadores />} />
                <Route path="jogadores/novo" element={<NovoJogador />} />
                <Route
                  path="jogadores/:id/editar"
                  element={<EditarJogador />}
                />
                <Route path="etapas" element={<ListagemEtapas />} />
                <Route path="etapas/criar" element={<CriarEtapa />} />
                <Route path="etapas/:id" element={<DetalhesEtapa />} />
                <Route path="etapas/:id/editar" element={<EditarEtapa />} />
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ArenaProvider>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
