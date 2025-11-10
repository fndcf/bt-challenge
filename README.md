# 🎾 Challenge BT - Sistema de Torneio de Beach Tennis

Sistema completo para gerenciamento de torneios de Beach Tennis com suporte a múltiplas arenas.

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Documentação](#documentação)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)
- [Licença](#licença)

## 🎯 Sobre

Challenge BT é uma plataforma completa para gerenciamento de torneios de Beach Tennis, permitindo:

- Cadastro de jogadores por categoria e nível
- Geração automática de duplas e grupos
- Sistema de pontuação individual
- Rankings dinâmicos
- Histórico de etapas e estatísticas
- Suporte para múltiplas arenas (multi-tenancy)

## ✨ Funcionalidades

### Para Administradores

- ✅ Cadastro e gestão de jogadores
- ✅ Criação de etapas/challenges
- ✅ Geração automática de chaves (mínimo 12 jogadores, números pares)
- ✅ Organização em grupos de 3-4 duplas
- ✅ Registro de resultados
- ✅ Controle de parceiros (não repetição entre etapas)
- ✅ Sistema de desempate (vitórias, saldo de games, confronto direto, sorteio)
- ✅ URL exclusiva por arena

### Para Jogadores/Espectadores

- ✅ Visualização de rankings
- ✅ Histórico de participações
- ✅ Estatísticas individuais
- ✅ Acompanhamento de etapas em andamento

## 🚀 Tecnologias

### Backend

- Node.js + Express + TypeScript
- Firebase Admin SDK
- Firestore Database
- JWT Authentication
- Express Validator

### Frontend

- React 18 + TypeScript
- Vite (build tool)
- React Router v6
- Context API (gerenciamento de estado)
- Axios (HTTP client)
- Firebase Client SDK

### Database & Hosting

- Firebase Firestore
- Firebase Authentication
- Firebase Hosting

## 📋 Requisitos

- Node.js v18+ ([Download](https://nodejs.org))
- npm ou yarn
- Conta no [Firebase](https://firebase.google.com)
- Git

## 🔧 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/challenge-bt.git
cd challenge-bt
```

### 2. Instalar todas as dependências

```bash
npm run install:all
```

Ou manualmente:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## ⚙️ Configuração

### 1. Configurar Firebase

Siga o guia detalhado: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

**Resumo:**

1. Criar projeto no Firebase Console
2. Ativar Firestore Database
3. Ativar Authentication (Email/Password)
4. Obter credenciais (Admin SDK e Client SDK)

### 2. Variáveis de Ambiente

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env`:

```env
PORT=5000
NODE_ENV=development

FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-project.iam.gserviceaccount.com

ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=sua-chave-secreta-aqui
```

#### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

Editar `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

VITE_API_URL=http://localhost:5000/api
```

### 3. Verificar Configuração

```bash
./check-setup.sh
```

## 🏃 Executando o Projeto

### Opção 1: Tudo junto (Recomendado)

```bash
npm run dev
```

Isso iniciará:

- Backend em `http://localhost:5000`
- Frontend em `http://localhost:3000`

### Opção 2: Separadamente

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Acessar a Aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 📁 Estrutura do Projeto

```
challenge-bt/
├── backend/               # API Node.js + Express
│   ├── src/
│   │   ├── config/       # Configurações (Firebase, Firestore)
│   │   ├── controllers/  # Controladores REST
│   │   ├── domain/       # Entidades de negócio
│   │   ├── middlewares/  # Autenticação, validação, etc
│   │   ├── repositories/ # Acesso a dados
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   └── utils/        # Utilitários
│   └── MIDDLEWARES.md    # Documentação dos middlewares
│
├── frontend/             # Interface React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── contexts/     # Context API (Auth, Arena)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Chamadas à API
│   │   └── types/        # Types TypeScript
│   └── FRONTEND_SETUP.md # Documentação do frontend
│
├── shared/               # Código compartilhado
│   └── types/           # Types TypeScript compartilhados
│
├── FIREBASE_SETUP.md    # Guia de configuração Firebase
├── QUICK_START.md       # Guia de início rápido
├── TROUBLESHOOTING.md   # Soluções para problemas comuns
├── check-setup.sh       # Script de verificação
└── test-integration.sh  # Testes de integração
```

## 📚 Documentação

- **[QUICK_START.md](./QUICK_START.md)** - Guia de início rápido
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Como configurar o Firebase
- **[backend/MIDDLEWARES.md](./backend/MIDDLEWARES.md)** - Documentação dos middlewares
- **[frontend/FRONTEND_SETUP.md](./frontend/FRONTEND_SETUP.md)** - Documentação do frontend
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Resolução de problemas

## 🧪 Testes

### Verificar Setup

```bash
./check-setup.sh
```

### Testar Integração

```bash
# Com backend e frontend rodando
./test-integration.sh
```

### Rodar Testes Unitários

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🔍 Troubleshooting

Problemas comuns e soluções: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**Problemas frequentes:**

- Porta já em uso → `lsof -ti:5000 | xargs kill -9`
- Dependências corrompidas → `npm run clean && npm run install:all`
- Firebase não configurado → Ver [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- CORS error → Verificar `ALLOWED_ORIGINS` em `backend/.env`

## 📊 Status do Projeto

### ✅ Etapa 1: Arquitetura e Setup Inicial (COMPLETA)

- ✅ Estrutura de pastas
- ✅ Configuração Firebase
- ✅ Setup Backend (Express + TypeScript)
- ✅ Setup Frontend (React + TypeScript)
- ✅ Integração e testes

### ⏳ Próximas Etapas

- Etapa 2: Autenticação e Multi-tenancy
- Etapa 3: Gestão de Jogadores
- Etapa 4: Sistema de Geração de Chaves
- Etapa 5: Sistema de Jogos e Resultados
- Etapa 6: Ranking e Estatísticas
- Etapa 7: Regra de Não Repetição de Parceiros
- Etapa 8: Interface Pública

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🎾 Roadmap Completo

### Fase 1: Fundação ✅

- [x] Setup inicial do projeto
- [x] Configuração Firebase
- [x] Backend básico com Express
- [x] Frontend básico com React
- [x] Sistema de autenticação
- [x] Documentação inicial

### Fase 2: Core Features (Em Andamento)

- [ ] Sistema completo de autenticação
- [ ] Multi-tenancy (múltiplas arenas)
- [ ] CRUD de jogadores
- [ ] CRUD de challenges
- [ ] Geração de chaves e grupos

### Fase 3: Lógica de Torneio

- [ ] Sistema de jogos
- [ ] Registro de resultados
- [ ] Fase de grupos
- [ ] Fase eliminatória
- [ ] Sistema de desempate

### Fase 4: Rankings e Estatísticas

- [ ] Cálculo de pontuação
- [ ] Rankings individuais
- [ ] Estatísticas por jogador
- [ ] Histórico de etapas

### Fase 5: Interface Pública

- [ ] Página pública por arena
- [ ] Visualização de rankings
- [ ] Acompanhamento de etapas
- [ ] Estatísticas públicas

### Fase 6: Polimento

- [ ] Testes automatizados
- [ ] Deploy em produção
- [ ] Otimizações de performance
- [ ] SEO e acessibilidade

---

**Feito com ❤️ para a comunidade de Beach Tennis** 🎾
