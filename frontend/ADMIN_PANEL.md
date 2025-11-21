# 🎛️ Painel Administrativo - Documentação

## 📋 Visão Geral

Interface completa de administração para gerenciar arenas, jogadores, challenges e rankings do Challenge BT.

## 🎯 Funcionalidades Implementadas

### ✅ Layout Administrativo (`AdminLayout.tsx`)

- Sidebar responsiva com navegação
- Header com informações do usuário
- Botão de logout funcional
- Toggle da sidebar
- Informações da arena
- Link para página pública

### ✅ Dashboard (`Dashboard.tsx`)

- Cartões de estatísticas
- Ações rápidas
- Guia de primeiros passos
- Seção de ajuda
- Design responsivo e animado

### ✅ Navegação

- 5 seções principais:
  - 📊 Dashboard
  - 👥 Jogadores
  - 🏆 Challenges
  - 📈 Ranking
  - ⚙️ Configurações

## 📁 Arquivos Criados

```
frontend/src/
├── components/
│   ├── AdminLayout.tsx         # Layout do painel
│   ├── AdminLayout.css         # Estilos do layout
│   └── ErrorBoundary.tsx       # Captura de erros
│
└── pages/
    ├── Dashboard.tsx           # Dashboard principal
    ├── Dashboard.css           # Estilos do dashboard
    ├── Jogadores.tsx           # Placeholder jogadores
    └── AdminPages.tsx          # Outros placeholders
```

## 🎨 Componentes

### AdminLayout

**Localização:** `frontend/src/components/AdminLayout.tsx`

**Features:**

- Sidebar com menu de navegação
- Sidebar colapsável (desktop) ou drawer (mobile)
- Header com perfil do usuário
- Botão de logout
- Link para página pública
- Responsivo

**Estados da Sidebar:**

- **Aberta:** 260px de largura, mostra labels
- **Fechada:** 80px de largura, mostra apenas ícones

**Itens do Menu:**

```typescript
const menuItems = [
  { path: "/admin", icon: "📊", label: "Dashboard", exact: true },
  { path: "/admin/jogadores", icon: "👥", label: "Jogadores" },
  { path: "/admin/challenges", icon: "🏆", label: "Challenges" },
  { path: "/admin/ranking", icon: "📈", label: "Ranking" },
  { path: "/admin/configuracoes", icon: "⚙️", label: "Configurações" },
];
```

### Dashboard

**Localização:** `frontend/src/pages/Dashboard.tsx`

**Seções:**

1. **Welcome Section**

   - Saudação personalizada
   - Badge da arena com slug

2. **Stats Cards (4 cards)**

   - Jogadores
   - Challenges
   - Jogos
   - Ranking

3. **Quick Actions (4 ações)**

   - Cadastrar Jogador
   - Criar Challenge
   - Ver Ranking
   - Configurações

4. **Getting Started (3 passos)**

   - Cadastre Jogadores
   - Crie um Challenge
   - Compartilhe sua Arena

5. **Help Section**
   - Acesso à documentação
   - Link para suporte

## 🎯 Estrutura de Rotas

```
/admin
├── /admin                    → Dashboard
├── /admin/jogadores          → Jogadores
├── /admin/challenges         → Challenges
├── /admin/ranking            → Ranking
└── /admin/configuracoes      → Configurações
```

## 🔐 Proteção de Rotas

Todas as rotas `/admin/*` são protegidas:

```typescript
<Route
  path="/admin"
  element={
    <PrivateRoute requireAdmin>
      <AdminLayout />
    </PrivateRoute>
  }
>
  {/* Rotas filhas */}
</Route>
```

## 🎨 Design Features

### Cores do Tema

- **Primary:** #134e5e (Roxo)
- **Secondary:** #71b280 (Roxo Escuro)
- **Accent 1:** #f093fb (Rosa)
- **Accent 2:** #4facfe (Azul)
- **Accent 3:** #43e97b (Verde)
- **Background:** #f5f7fa (Cinza Claro)

### Gradientes

```css
/* Sidebar */
background: linear-gradient(180deg, #134e5e 0%, #71b280 100%);

/* Welcome Section */
background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);

/* Help Section */
background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
```

### Animações

- `fadeIn` - Fade suave ao carregar
- `slideUp` - Slide de baixo para cima
- `bounce` - Logo animado

### Responsividade

- **Desktop (>1024px):** Sidebar fixa, todos os elementos visíveis
- **Tablet (768px-1024px):** Alguns textos ocultos
- **Mobile (<768px):** Sidebar como drawer, layout adaptado

## 🔧 Como Usar

### Acessar o Painel

1. **Fazer Login:**

   ```
   http://localhost:3000/login
   ```

2. **Após Login → Redirecionamento Automático:**
   ```
   http://localhost:3000/admin
   ```

### Navegação

- **Desktop:** Clique nos itens da sidebar
- **Mobile:** Use o botão de menu (☰)

### Logout

- Clique no botão 🚪 no header
- Ou use o atalho de teclado (se configurado)

## 📱 Responsividade

### Desktop (> 1024px)

```
┌──────────────────────────────────────────┐
│  Sidebar  │  Header                      │
│  (260px)  │  ┌──────────────────────┐   │
│           │  │                        │   │
│  📊 Menu  │  │     Content Area      │   │
│  👥 Menu  │  │                        │   │
│  🏆 Menu  │  │                        │   │
│           │  └──────────────────────┘   │
└──────────────────────────────────────────┘
```

### Tablet (768px - 1024px)

- Sidebar mantém largura
- Alguns textos ocultos
- Layout compacto

### Mobile (< 768px)

```
┌──────────────────────┐
│  ☰  Header           │
├──────────────────────┤
│                      │
│    Content Area      │
│                      │
│                      │
└──────────────────────┘

[Sidebar como Drawer]
```

## 🧪 Teste Manual

### Testar Layout

1. **Acesse:** http://localhost:3000/admin

2. **Teste Sidebar:**

   - Clique no botão ← / → para colapsar/expandir
   - Verifique animação suave
   - Items devem mudar de visual

3. **Teste Navegação:**

   - Clique em cada item do menu
   - Verifique se a rota muda
   - Item ativo deve ter destaque

4. **Teste Logout:**

   - Clique no botão 🚪
   - Deve redirecionar para /login
   - Token deve ser removido

5. **Teste Responsivo:**
   - Abra DevTools (F12)
   - Mude para diferentes tamanhos
   - Verifique adaptação do layout

### Testar Dashboard

1. **Visualizar Cards:**

   - 4 cards de estatísticas visíveis
   - Hover deve elevar o card
   - Links devem funcionar

2. **Ações Rápidas:**

   - 4 cards de ações visíveis
   - Hover deve elevar o card
   - Links funcionam (mesmo que vão para placeholder)

3. **Primeiros Passos:**

   - 3 steps visíveis
   - Links funcionam

4. **Help Section:**
   - Seção visível
   - Links (placeholder por enquanto)

## 🎯 Fluxo do Usuário

```
1. Login → /admin (Dashboard)
   ↓
2. Ver estatísticas e ações
   ↓
3. Navegar pelo menu lateral
   ↓
4. Acessar funcionalidades
   ↓
5. Logout quando terminar
```

## 💡 Funcionalidades Futuras

### Etapa 3 - Jogadores

- CRUD completo de jogadores
- Listagem com filtros
- Categorização por nível

### Etapa 4 - Challenges

- Criar etapas
- Gerar chaves
- Registrar resultados

### Etapa 5 - Jogos

- Gerenciar partidas
- Classificação de grupos
- Fase eliminatória

### Etapa 6 - Ranking

- Cálculo de pontos
- Rankings dinâmicos
- Estatísticas detalhadas

### Etapa 7 - Regras

- Validação de duplas
- Histórico de parceiros
- Sistema de desempate

## 🐛 Troubleshooting

### Sidebar não abre/fecha

- Verifique se o estado `sidebarOpen` está funcionando
- Confirme que o CSS tem as classes `.open` e `.closed`

### Rotas não funcionam

- Verifique se o `AdminLayout` usa `<Outlet />`
- Confirme que as rotas filhas estão configuradas no `App.tsx`

### Logout não funciona

- Verifique se o `useAuth` está retornando a função `logout`
- Confirme que o token está sendo removido
- Veja o console para erros

### Layout quebrado no mobile

- Abra o DevTools
- Verifique media queries no CSS
- Teste diferentes tamanhos de tela

## 📚 Recursos Relacionados

- **AuthContext:** `frontend/src/contexts/AuthContext.tsx`
- **ArenaContext:** `frontend/src/contexts/ArenaContext.tsx`
- **PrivateRoute:** `frontend/src/components/PrivateRoute.tsx`
- **Frontend Setup:** `frontend/FRONTEND_SETUP.md`

---

**Documentação criada para Challenge BT - Sub-parte 2.3**
