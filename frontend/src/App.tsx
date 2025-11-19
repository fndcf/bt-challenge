import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ArenaProvider } from "./contexts/ArenaContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterArena from "./pages/RegisterArena";
import RecuperarSenha from "./pages/RecuperarSenha";
import Dashboard from "./pages/Dashboard";
import Jogadores from "./pages/Jogadores";
import NovoJogador from "./pages/NovoJogador";
import EditarJogador from "./pages/EditarJogador";
import { Ranking } from "./pages/AdminPages";
import { ListagemEtapas } from "./pages/etapas/ListagemEtapas";
import { CriarEtapa } from "./pages/etapas/CriarEtapa";
import { EditarEtapa } from "./pages/etapas/EditarEtapa";
import { DetalhesEtapa } from "./pages/etapas/DetalhesEtapa";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import "./config/firebase"; // Inicializar Firebase
import { ToastProvider } from "./components/ui";

function App() {
  return (
    <ToastProvider position="top-right">
      {" "}
      {/* ← Adicionar */}
      <BrowserRouter>
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
              <Route path="/arena/:slug" element={<Home />} />

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
                <Route path="ranking" element={<Ranking />} />
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
