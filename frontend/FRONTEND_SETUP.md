# 🎨 Frontend Setup - Documentação

## 📋 Visão Geral

O frontend foi construído com React + TypeScript + Vite, utilizando Context API para gerenciamento de estado global.

## 🏗️ Estrutura

```
frontend/src/
├── config/
│   └── firebase.ts           # Configuração Firebase Client
├── contexts/
│   ├── AuthContext.tsx       # Contexto de autenticação
│   └── ArenaContext.tsx      # Contexto de arena atual
├── services/
│   ├── apiClient.ts          # Cliente HTTP (Axios)
│   └── arenaService.ts       # Serviço de arena
├── hooks/
│   └── index.ts              # Custom hooks
├── components/
│   ├── LoadingSpinner.tsx    # Componente de loading
│   ├── ErrorMessage.tsx      # Componente de erro
│   └── PrivateRoute.tsx      # Componente de rota protegida
├── pages/
│   ├── Home.tsx              # Página inicial
│   ├── Login.tsx             # Página de login
│   ├── NotFound.tsx          # Página 404
│   └── Unauthorized.tsx      # Página 403
├── types/
│   └── index.ts              # Types TypeScript
├── App.tsx                   # Componente raiz
├── main.tsx                  # Entry point
└── index.css                 # Estilos globais
```

## 🎯 Contextos

### AuthContext

Gerencia o estado de autenticação do usuário.

**Uso:**

```typescript
import { useAuth } from "../contexts/AuthContext";

const MyComponent = () => {
  const { user, login, logout, loading, error } = useAuth();

  // user: dados do usuário autenticado
  // login: função para fazer login
  // logout: função para fazer logout
  // loading: estado de loading
  // error: mensagem de erro
};
```

**Métodos:**

- `login(email, password)` - Fazer login
- `logout()` - Fazer logout
- `register(email, password)` - Registrar novo usuário

### ArenaContext

Gerencia a arena atual baseado na URL.

**Uso:**

```typescript
import { useArena } from "../contexts/ArenaContext";

const MyComponent = () => {
  const { arena, loading, error, setArena } = useArena();

  // arena: dados da arena atual
  // loading: estado de loading
  // error: mensagem de erro
  // setArena: função para definir arena
};
```

## 🔌 Services

### API Client

Cliente HTTP configurado com interceptors.

**Uso:**

```typescript
import { apiClient } from "../services/apiClient";

// GET
const data = await apiClient.get("/jogadores");

// POST
const newData = await apiClient.post("/jogadores", { nome: "João" });

// PUT
const updated = await apiClient.put("/jogadores/123", { nome: "João Silva" });

// DELETE
await apiClient.delete("/jogadores/123");

// Upload
await apiClient.upload("/upload", file, (progress) => {
  console.log(`${progress}% uploaded`);
});
```

**Recursos:**

- ✅ Adiciona token automaticamente
- ✅ Tratamento de erros centralizado
- ✅ Logout automático em 401
- ✅ Suporte a upload com progresso

### Arena Service

Serviço para operações de arena.

**Uso:**

```typescript
import { arenaService } from '../services/arenaService';

// Buscar por slug
const arena = await arenaService.getBySlug('arenaazul');

// Buscar por ID
const arena = await arenaService.getById('arena-123');

// Listar todas
const arenas = await arenaService.list();

// Criar
const newArena = await arenaService.create({ nome: 'Arena Nova', ... });

// Atualizar
const updated = await arenaService.update('arena-123', { nome: 'Novo Nome' });

// Deletar
await arenaService.delete('arena-123');
```

## 🪝 Custom Hooks

### useLoading

```typescript
const { loading, startLoading, stopLoading } = useLoading();
```

### useForm

```typescript
const { values, errors, handleChange, handleBlur, reset } = useForm({
  email: "",
  password: "",
});
```

### useDebounce

```typescript
const debouncedValue = useDebounce(searchTerm, 500);
```

### useMediaQuery

```typescript
const isMobile = useMediaQuery("(max-width: 768px)");
```

### useLocalStorage

```typescript
const [value, setValue, removeValue] = useLocalStorage("key", "defaultValue");
```

### useClipboard

```typescript
const { copied, copy } = useClipboard();
await copy("texto para copiar");
```

### useAsync

```typescript
const { data, loading, error, execute } = useAsync(fetchData);
```

### useDocumentTitle

```typescript
useDocumentTitle("Título da Página");
```

## 🛡️ Rotas Protegidas

Use o componente `PrivateRoute` para proteger rotas:

```typescript
<Route
  path="/admin"
  element={
    <PrivateRoute requireAdmin>
      <AdminPanel />
    </PrivateRoute>
  }
/>
```

**Props:**

- `requireAdmin` - Requer que o usuário seja admin

## 🎨 Componentes

### LoadingSpinner

```typescript
<LoadingSpinner
  size="medium" // small | medium | large
  fullScreen={true} // Tela cheia
  message="Carregando..."
/>
```

### ErrorMessage

```typescript
<ErrorMessage
  message="Erro ao carregar dados"
  onRetry={() => refetch()}
  fullScreen={true}
/>
```

## 🚀 Como Usar

### 1. Proteger uma rota

```typescript
<Route
  path="/admin"
  element={
    <PrivateRoute requireAdmin>
      <AdminPage />
    </PrivateRoute>
  }
/>
```

### 2. Fazer uma requisição à API

```typescript
const fetchJogadores = async () => {
  try {
    const jogadores = await apiClient.get("/jogadores");
    setJogadores(jogadores);
  } catch (error) {
    console.error(error);
  }
};
```

### 3. Usar autenticação

```typescript
const { user, login, logout } = useAuth();

const handleLogin = async () => {
  try {
    await login(email, password);
    navigate("/admin");
  } catch (error) {
    console.error(error);
  }
};
```

### 4. Criar um formulário

```typescript
const { values, errors, handleChange, handleBlur } = useForm({
  nome: "",
  email: "",
});

<input
  value={values.nome}
  onChange={(e) => handleChange("nome", e.target.value)}
  onBlur={() => handleBlur("nome")}
/>;
```

## 📱 Responsividade

Todos os componentes são responsivos. Use o hook `useMediaQuery` para lógica condicional:

```typescript
const isMobile = useMediaQuery("(max-width: 768px)");

return <div>{isMobile ? <MobileView /> : <DesktopView />}</div>;
```

## 🎨 Estilos

- Todos os componentes têm seus próprios arquivos CSS
- Cores principais: #134e5e (roxo) e #71b280 (roxo escuro)
- Gradient padrão: `linear-gradient(135deg, #134e5e 0%, #71b280 100%)`

## 🔧 Variáveis de Ambiente

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Debug

Em desenvolvimento, o console mostrará:

- Erros de autenticação
- Erros de requisições HTTP
- Estado dos contextos

## 📚 Próximos Passos

Com essa estrutura, você pode:

- ✅ Criar novas páginas
- ✅ Adicionar novos contextos
- ✅ Criar novos services
- ✅ Adicionar novos hooks
- ✅ Proteger rotas
- ✅ Fazer requisições à API

---

**Documentação criada com ❤️ para Challenge BT**
