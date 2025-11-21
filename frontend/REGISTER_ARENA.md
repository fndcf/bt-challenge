# 🎨 Sistema de Registro de Arenas - Frontend

## 📋 Visão Geral

Interface completa para registro de novas arenas no Challenge BT.

## 🎯 Funcionalidades Implementadas

### ✅ Página de Registro (`RegisterArena.tsx`)

- Formulário completo com validações
- Auto-geração de slug a partir do nome
- Verificação de disponibilidade de slug em tempo real
- Feedback visual de sucesso/erro
- Redirecionamento automático após sucesso
- Design responsivo

### ✅ Validações do Formulário

- **Nome da Arena:** Mínimo 3 caracteres
- **Slug:** Formato específico (a-z, 0-9, hífens), verificação de disponibilidade
- **Email:** Formato válido
- **Senha:** Mínimo 6 caracteres
- **Confirmar Senha:** Deve coincidir com a senha

### ✅ Recursos Especiais

- **Auto-geração de Slug:** Remove acentos, caracteres especiais, converte para minúsculas
- **Debounce:** Verificação de slug após 500ms de inatividade
- **Loading States:** Feedback durante verificação e submissão
- **Mensagens de Status:** Disponível, indisponível, verificando

## 📁 Arquivos Criados

```
frontend/src/
├── pages/
│   ├── RegisterArena.tsx       # Página de registro
│   └── RegisterArena.css       # Estilos da página
│
├── components/
│   ├── Alert.tsx               # Componente de alertas
│   └── Alert.css               # Estilos do alerta
│
└── services/
    └── arenaService.ts         # Atualizado com novos métodos
```

## 🎨 Componentes

### RegisterArena

**Localização:** `frontend/src/pages/RegisterArena.tsx`

**Uso:**

```typescript
import RegisterArena from "./pages/RegisterArena";

// No router
<Route path="/register" element={<RegisterArena />} />;
```

**Features:**

- Formulário com 5 campos (nome, slug, email, senha, confirmar senha)
- Validação em tempo real
- Verificação de slug com debounce
- Feedback visual com cores e ícones
- Auto-redirecionamento após sucesso

### Alert

**Localização:** `frontend/src/components/Alert.tsx`

**Uso:**

```typescript
import Alert from '../components/Alert';

// Sucesso
<Alert type="success" message="Operação concluída!" />

// Erro
<Alert type="error" message="Algo deu errado" />

// Warning
<Alert type="warning" message="Atenção!" />

// Info
<Alert type="info" message="Informação importante" />

// Com auto-close e callback
<Alert
  type="success"
  message="Salvo!"
  autoClose={3000}
  onClose={() => console.log('Fechou')}
/>
```

**Props:**

- `type`: 'success' | 'error' | 'warning' | 'info'
- `message`: string
- `onClose?`: () => void
- `autoClose?`: number (ms)

## 🔧 Service Atualizado

### ArenaService

Novos métodos adicionados:

```typescript
// Criar arena
await arenaService.create({
  nome: "Arena Azul",
  slug: "arenaazul",
  adminEmail: "admin@arena.com",
  adminPassword: "senha123",
});

// Verificar disponibilidade de slug
const available = await arenaService.checkSlugAvailability("arenaazul");

// Obter minha arena (autenticado)
const myArena = await arenaService.getMyArena();

// Desativar arena
await arenaService.deactivate("arena-id");
```

## 🎯 Fluxo do Usuário

1. **Acessa `/register`**
2. **Preenche o nome** → Slug é auto-gerado
3. **Edita slug (opcional)** → Sistema verifica disponibilidade
4. **Preenche email e senha**
5. **Clica em "Criar Arena"** → Loading durante criação
6. **Sucesso!** → Mensagem exibida + redirecionamento para login
7. **Login** → Acessa painel administrativo da arena

## 🎨 Design Features

### Cores e Status

- **Disponível:** Verde (#27ae60)
- **Indisponível:** Vermelho (#e74c3c)
- **Verificando:** Cinza (#666)
- **Primary:** Roxo (#134e5e)
- **Gradiente:** #134e5e → #71b280

### Estados Visuais

- ✓ Slug disponível (verde)
- ✗ Slug indisponível (vermelho)
- 🔄 Verificando... (cinza com spinner)
- ✅ Arena criada (alert verde)
- ❌ Erro (alert vermelho)

### Responsividade

- Mobile-first design
- Breakpoint: 768px
- Adapta formulário e textos
- Mantém usabilidade em todas as telas

## 📱 Responsividade

### Desktop (> 768px)

- Container: 600px largura máxima
- Padding: 3rem
- Fonte: tamanho normal

### Mobile (< 768px)

- Container: 100% largura
- Padding: 2rem 1.5rem
- Fonte: reduzida
- Slug prefix: fonte menor

## 🔐 Validações

### Nome da Arena

```typescript
// Mínimo 3 caracteres
if (!values.nome || values.nome.trim().length < 3) {
  error = "Nome deve ter no mínimo 3 caracteres";
}
```

### Slug

```typescript
// Formato específico
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
  error = "Slug inválido";
}

// Disponibilidade
if (!slugAvailable) {
  error = "Slug já está em uso";
}
```

### Email

```typescript
// Formato de email
if (!/\S+@\S+\.\S+/.test(values.adminEmail)) {
  error = "Email inválido";
}
```

### Senha

```typescript
// Mínimo 6 caracteres
if (values.adminPassword.length < 6) {
  error = "Senha deve ter no mínimo 6 caracteres";
}

// Confirmação
if (values.adminPassword !== values.confirmPassword) {
  error = "As senhas não coincidem";
}
```

## 🧪 Teste Manual

### Testar a Página

1. **Acesse:** http://localhost:3000/register

2. **Teste Auto-geração de Slug:**

   - Digite "Minha Arena Azul"
   - Slug deve ser: "minha-arena-azul"

3. **Teste Verificação de Slug:**

   - Digite um slug
   - Aguarde 500ms
   - Veja status (disponível/indisponível)

4. **Teste Validações:**

   - Envie formulário vazio → Veja erros
   - Digite senha diferente → Veja erro de confirmação
   - Use slug inválido → Veja erro de formato

5. **Teste Criação:**
   - Preencha tudo corretamente
   - Clique em "Criar Arena"
   - Veja mensagem de sucesso
   - Aguarde redirecionamento

## 🔄 Integração com Backend

### Criar Arena

```typescript
POST /api/arenas
{
  "nome": "Arena Azul",
  "slug": "arenaazul",
  "adminEmail": "admin@arena.com",
  "adminPassword": "senha123"
}
```

### Verificar Slug

```typescript
GET / api / arenas / check - slug / arenaazul;
```

## 💡 Dicas de Uso

### Como Gerar um Bom Slug

1. Use o nome da arena
2. Remova acentos e caracteres especiais
3. Use hífens para separar palavras
4. Mantenha curto e memorável
5. Evite números desnecessários

**Exemplos:**

- "Arena Azul Beach Tennis" → `arenaazul`
- "CT São Paulo" → `ct-sao-paulo`
- "Beach Club Rio" → `beach-club-rio`

## 🐛 Troubleshooting

### Slug não verifica

- **Causa:** Backend não está rodando
- **Solução:** Inicie o backend (`cd backend && npm run dev`)

### Formulário não submete

- **Causa:** Validações falhando
- **Solução:** Verifique os campos em vermelho

### Erro após criar arena

- **Causa:** Firebase não configurado
- **Solução:** Configure credenciais do Firebase

## 📚 Recursos Relacionados

- **Backend API:** `backend/API_ARENAS.md`
- **Frontend Setup:** `frontend/FRONTEND_SETUP.md`
- **Firebase Setup:** `FIREBASE_SETUP.md`

---

**Documentação criada para Challenge BT - Sub-parte 2.2**
