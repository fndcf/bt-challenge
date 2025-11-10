import React, { useState, useEffect } from "react";
import { Jogador, NivelJogador, StatusJogador } from "../../types/jogador";
import jogadorService from "../../services/jogadorService";
import etapaService from "../../services/etapaService";

interface ModalInscricaoProps {
  etapaId: string;
  etapaNome: string;
  etapaNivel: NivelJogador; // ← ADICIONADO
  maxJogadores: number;
  totalInscritos: number;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para inscrever jogadores em uma etapa
 */
export const ModalInscricao: React.FC<ModalInscricaoProps> = ({
  etapaId,
  etapaNome,
  etapaNivel, // ← ADICIONADO
  maxJogadores,
  totalInscritos,
  onClose,
  onSuccess,
}) => {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [jogadoresInscritosIds, setJogadoresInscritosIds] = useState<string[]>(
    []
  ); // ← NOVO
  const [jogadoresSelecionados, setJogadoresSelecionados] = useState<Jogador[]>(
    []
  );
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJogadores, setLoadingJogadores] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novoJogador, setNovoJogador] = useState({
    nome: "",
    email: "",
    telefone: "",
    nivel: etapaNivel, // ← ALTERADO: Usa nível da etapa
    status: StatusJogador.ATIVO,
  });

  const vagasDisponiveis = maxJogadores - totalInscritos;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    await Promise.all([carregarJogadores(), carregarInscritos()]);
  };

  const carregarJogadores = async () => {
    try {
      setLoadingJogadores(true);
      const data = await jogadorService.listar({ nivel: etapaNivel }); // ← Filtrar pelo nível
      // data é ListagemJogadores, então pegamos data.jogadores
      setJogadores(data.jogadores || []);
    } catch (err: any) {
      console.error("Erro ao carregar jogadores:", err);
      setError("Erro ao carregar jogadores");
      setJogadores([]); // Array vazio em caso de erro
    } finally {
      setLoadingJogadores(false);
    }
  };

  const carregarInscritos = async () => {
    try {
      const inscricoes = await etapaService.listarInscricoes(etapaId);
      // Extrair apenas os IDs dos jogadores inscritos
      const ids = inscricoes.map((i) => i.jogadorId);
      setJogadoresInscritosIds(ids);
      console.log(`📋 ${ids.length} jogadores já inscritos nesta etapa`);
    } catch (err: any) {
      console.error("Erro ao carregar inscritos:", err);
      setJogadoresInscritosIds([]);
    }
  };

  const handleCadastrarJogador = async () => {
    if (!novoJogador.nome.trim()) {
      setError("Por favor, preencha o nome do jogador");
      setSuccessMessage(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const jogadorCriado = await jogadorService.criar(novoJogador);

      // Adiciona à lista
      setJogadores([...jogadores, jogadorCriado]);

      // Limpa formulário
      setNovoJogador({
        nome: "",
        email: "",
        telefone: "",
        nivel: NivelJogador.INICIANTE,
        status: StatusJogador.ATIVO,
      });
      setMostrarFormulario(false);

      // Mostrar sucesso
      setSuccessMessage(`✓ ${jogadorCriado.nome} cadastrado com sucesso!`);

      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erro ao cadastrar:", err);

      // Extrair mensagem de erro
      let mensagemErro = "Erro ao cadastrar jogador";

      if (err.message) {
        mensagemErro = err.message;
      }

      // Verificar se é erro de nome duplicado
      if (mensagemErro.toLowerCase().includes("já existe")) {
        mensagemErro = "⚠️ " + mensagemErro;
      }

      setError(mensagemErro);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar jogadores disponíveis (não inscritos + busca)
  const jogadoresDisponiveis = (jogadores || []).filter(
    (jogador) => !jogadoresInscritosIds.includes(jogador.id) // ← NÃO mostrar se já inscrito
  );

  const jogadoresFiltrados = jogadoresDisponiveis.filter(
    (jogador) =>
      jogador.nome.toLowerCase().includes(busca.toLowerCase()) ||
      jogador.email.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleJogador = (jogador: Jogador) => {
    const jaEstaSelecionado = jogadoresSelecionados.some(
      (j) => j.id === jogador.id
    );

    if (jaEstaSelecionado) {
      setJogadoresSelecionados(
        jogadoresSelecionados.filter((j) => j.id !== jogador.id)
      );
    } else {
      // Verificar se ainda tem vaga
      if (jogadoresSelecionados.length >= vagasDisponiveis) {
        alert(
          `Você só pode inscrever ${vagasDisponiveis} jogador(es) nesta etapa.`
        );
        return;
      }
      setJogadoresSelecionados([...jogadoresSelecionados, jogador]);
    }
  };

  const handleInscrever = async () => {
    if (jogadoresSelecionados.length === 0) {
      alert("Selecione pelo menos um jogador");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Inscrever jogadores usando o serviço
      const jogadorIds = jogadoresSelecionados.map((j) => j.id);
      await etapaService.inscreverJogadores(etapaId, jogadorIds);

      alert(
        `${jogadoresSelecionados.length} jogador(es) inscrito(s) com sucesso!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao inscrever:", err);
      setError(err.message || "Erro ao inscrever jogadores");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Inscrever Jogadores
              </h2>
              <p className="text-sm text-gray-600 mt-1">{etapaNome}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {/* Nível da etapa */}
            <div className="bg-purple-50 px-3 py-2 rounded">
              <span className="text-purple-600 font-medium">Nível: </span>
              <span className="text-purple-900 font-bold">
                {etapaNivel === NivelJogador.INICIANTE && "🌱 Iniciante"}
                {etapaNivel === NivelJogador.INTERMEDIARIO &&
                  "⚡ Intermediário"}
                {etapaNivel === NivelJogador.AVANCADO && "🔥 Avançado"}
                {etapaNivel === NivelJogador.PROFISSIONAL && "⭐ Profissional"}
              </span>
            </div>

            {/* Jogadores disponíveis para inscrever */}
            <div className="bg-cyan-50 px-3 py-2 rounded">
              <span className="text-cyan-600 font-medium">
                Jogadores disponíveis:{" "}
              </span>
              <span className="text-cyan-900 font-bold">
                {jogadoresDisponiveis.length} de {jogadores.length}
              </span>
            </div>

            <div className="bg-blue-50 px-3 py-2 rounded">
              <span className="text-blue-600 font-medium">
                Vagas na etapa:{" "}
              </span>
              <span className="text-blue-900">{vagasDisponiveis}</span>
            </div>
            <div className="bg-green-50 px-3 py-2 rounded">
              <span className="text-green-600 font-medium">Selecionados: </span>
              <span className="text-green-900">
                {jogadoresSelecionados.length}
              </span>
            </div>
          </div>

          {/* Aviso sobre nível */}
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Atenção:</strong> Apenas jogadores{" "}
              <strong>{etapaNivel}</strong> que ainda não estão inscritos
              aparecem na lista
            </p>
          </div>
        </div>

        {/* Tabs: Selecionar ou Cadastrar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarFormulario(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !mostrarFormulario
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Selecionar Jogadores
            </button>
            <button
              onClick={() => setMostrarFormulario(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mostrarFormulario
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              + Cadastrar Novo
            </button>
          </div>
        </div>

        {/* Busca (apenas quando está selecionando) */}
        {!mostrarFormulario && (
          <div className="px-6 py-4 border-b border-gray-200">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="🔍 Buscar jogador por nome ou email..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Conteúdo: Lista ou Formulário */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mostrarFormulario ? (
            // FORMULÁRIO DE CADASTRO
            <div className="max-w-lg mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cadastrar Novo Jogador
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoJogador.nome}
                    onChange={(e) =>
                      setNovoJogador({ ...novoJogador, nome: e.target.value })
                    }
                    placeholder="Nome completo"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={novoJogador.email}
                    onChange={(e) =>
                      setNovoJogador({ ...novoJogador, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={novoJogador.telefone}
                    onChange={(e) =>
                      setNovoJogador({
                        ...novoJogador,
                        telefone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nível <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={
                      etapaNivel === NivelJogador.INICIANTE
                        ? "🌱 Iniciante"
                        : etapaNivel === NivelJogador.INTERMEDIARIO
                        ? "⚡ Intermediário"
                        : etapaNivel === NivelJogador.AVANCADO
                        ? "🔥 Avançado"
                        : "⭐ Profissional"
                    }
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O jogador será criado automaticamente com o nível desta
                    etapa
                  </p>
                </div>

                <button
                  onClick={handleCadastrarJogador}
                  disabled={loading || !novoJogador.nome.trim()}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Cadastrando..." : "✓ Cadastrar Jogador"}
                </button>
              </div>
            </div>
          ) : loadingJogadores ? (
            // LOADING
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando jogadores...</p>
            </div>
          ) : jogadoresFiltrados.length === 0 ? (
            // LISTA VAZIA
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-2">
                {busca
                  ? "Nenhum jogador encontrado com esse termo"
                  : jogadores.length === 0
                  ? "Nenhum jogador cadastrado neste nível"
                  : jogadoresDisponiveis.length === 0
                  ? "✅ Todos os jogadores deste nível já estão inscritos!"
                  : "Nenhum jogador disponível"}
              </p>
              {!busca && jogadores.length === 0 && (
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Cadastrar primeiro jogador
                </button>
              )}
              {jogadoresDisponiveis.length === 0 && jogadores.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {jogadores.length} jogador(es) {etapaNivel} já inscrito(s)
                  nesta etapa
                </p>
              )}
            </div>
          ) : (
            // GRID DE JOGADORES
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jogadoresFiltrados.map((jogador) => {
                const selecionado = jogadoresSelecionados.some(
                  (j) => j.id === jogador.id
                );

                return (
                  <div
                    key={jogador.id}
                    onClick={() => toggleJogador(jogador)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selecionado
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {jogador.nome}
                          </h3>
                          {selecionado && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{jogador.email}</p>
                        {jogador.nivel && (
                          <span className="text-xs text-gray-500 mt-1 inline-block">
                            Nível: {jogador.nivel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Success */}
        {successMessage && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-200">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {jogadoresSelecionados.length > 0 && !mostrarFormulario && (
                <span>
                  {jogadoresSelecionados.length} jogador(es) selecionado(s)
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              {!mostrarFormulario && (
                <button
                  onClick={handleInscrever}
                  disabled={loading || jogadoresSelecionados.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Inscrevendo..." : "Inscrever"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
