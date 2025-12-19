# Challenge BT - Sistema de Torneio de Beach Tennis

Sistema completo para gerenciamento de torneios de Beach Tennis com suporte a múltiplas arenas.

## Sobre

Challenge BT é uma plataforma completa para gerenciamento de torneios de Beach Tennis, permitindo:

- Cadastro de jogadores por categoria e nível
- Quatro formatos de torneio: **Dupla Fixa**, **Rei da Praia**, **Super X** e **TEAMS**
- Geração automática de grupos e chaves eliminatórias
- Sistema de pontuação individual
- Rankings dinâmicos
- Histórico de etapas e estatísticas
- Suporte para múltiplas arenas (multi-tenancy)
- Página pública por arena com visualização de etapas

## Formatos de Torneio

### Dupla Fixa

Formato tradicional onde duplas são formadas via sorteio e permanecem juntas durante toda a etapa.

- Fase de grupos(ou grupo único) + Fase eliminatória
- Configurável: número de duplas por grupo e classificados por grupo

**Critérios de desempate:** Pontos → Saldo Games → Confronto direto\* → Games vencidos → Sorteio

### Rei da Praia

Jogadores individuais formam duplas rotativas a cada partida dentro de grupos de 4.

- Cada jogador joga 3 partidas com parceiros diferentes
- Fase de grupos + Fase eliminatória com duplas fixas formadas pelos classificados
- Opções de chaveamento: Melhores com Melhores, Pareamento por Ranking, Sorteio Aleatório

**Critérios de desempate:** Pontos → Vitórias → Saldo Games → Games vencidos → Sorteio

### Super X (Super 8, Super 12)

Similar ao Rei da Praia, mas com grupo único e sem fase eliminatória.

- Super 8: 8 jogadores, 7 rodadas
- Super 12: 12 jogadores, 11 rodadas
- Tabela de rodadas com duplas rotativas pré-definidas

**Critérios de desempate:** Pontos → Saldo Games → Games vencidos → Sorteio

### TEAMS

Formato por equipes com 4 ou 6 jogadores(feminino, masculino ou misto) por time.

- Fase de grupos entre equipes (ou grupo único) + Fase eliminatória
- Confrontos entre equipes com múltiplos jogos (2 ou 3 jogos por confronto)
- Formação de equipes: Mesmo Nível, Balanceado ou Manual
- Suporta de 2 a 8 grupos

**Critérios de desempate:** Pontos → Saldo Jogos → Saldo Games → Confronto direto\* → Games vencidos → Sorteio

> \*Confronto direto é aplicado apenas quando exatamente 2 duplas/equipes estão empatadas.

## Funcionalidades

### Para Administradores

- Cadastro e gestão de jogadores (com status ativo/inativo)
- Criação de etapas com quatro formatos de torneio
- Geração automática de grupos e chaves
- Registro de resultados (placar por games)
- Gerenciamento de cabeças de chave
- Controle de inscrições
- Fase de grupos + Fase eliminatória
- Dashboard com estatísticas

### Para Jogadores/Espectadores

- Visualização de rankings
- Histórico de participações
- Estatísticas individuais
- Acompanhamento de etapas em andamento
- Página pública da arena

## Tecnologias

### Backend

| Tecnologia         | Versão | Uso                      |
| ------------------ | ------ | ------------------------ |
| Node.js            | 20+    | Runtime                  |
| Express            | 4.18   | Framework HTTP           |
| TypeScript         | 5.3    | Tipagem estática         |
| Firebase Admin SDK | 12.0   | Autenticação e Firestore |
| Zod                | 4.1    | Validação de schemas     |
| Jest               | 29.7   | Testes unitários         |

### Frontend

| Tecnologia        | Versão | Uso                     |
| ----------------- | ------ | ----------------------- |
| React             | 18.2   | UI Library              |
| TypeScript        | 5.3    | Tipagem estática        |
| Vite              | 5.0    | Build tool              |
| React Router      | 6.21   | Roteamento              |
| Styled Components | 6.1    | Estilização             |
| Axios             | 1.6    | HTTP Client             |
| React Query       | 3.39   | Cache e estado servidor |
| Firebase          | 10.7   | Autenticação cliente    |
| Lucide React      | 0.555  | Ícones                  |
| Jest              | 30.2   | Testes unitários        |

### Infraestrutura

- Firebase Firestore (Database)
- Firebase Authentication
- Firebase Hosting (Frontend)
- Firebase Cloud Functions (Backend)

## Requisitos

- Node.js v20+
- npm ou yarn
- Conta no Firebase
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/challenge-bt.git
cd challenge-bt
```

### 2. Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Configuração

### Variáveis de Ambiente

#### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-project.iam.gserviceaccount.com

FRONTEND_URL=http://localhost:3000
```

#### Frontend (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

VITE_API_URL=http://localhost:5000/api
```

## Executando o Projeto

### Backend

```bash
cd backend
npm run dev
```

Servidor disponível em `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

Aplicação disponível em `http://localhost:3000`

### Endpoints da API

| Método | Endpoint                  | Descrição               |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/health`             | Health check            |
| GET    | `/api/arenas`             | Listar arenas           |
| GET    | `/api/jogadores`          | Listar jogadores        |
| GET    | `/api/etapas`             | Listar etapas           |
| GET    | `/api/partidas`           | Listar partidas         |
| GET    | `/api/public/arena/:slug` | Dados públicos da arena |

## Estrutura do Projeto

```
challenge-bt/
├── backend/
│   ├── src/
│   │   ├── __tests__/          # Testes unitários
│   │   │   ├── fixtures/       # Dados de teste
│   │   │   ├── mocks/          # Mocks para testes
│   │   │   └── services/       # Testes dos services
│   │   ├── config/             # Configuração Firebase
│   │   ├── controllers/        # Controllers REST
│   │   ├── domain/             # Entidades de domínio
│   │   ├── middlewares/        # Auth, validation, error handling
│   │   ├── models/             # Modelos de dados
│   │   ├── repositories/
│   │   │   ├── firebase/       # Implementações Firebase
│   │   │   └── interfaces/     # Contratos/interfaces
│   │   ├── routes/             # Rotas da API
│   │   ├── services/           # Lógica de negócio
│   │   │   └── teams/          # Services específicos do formato TEAMS
│   │   │       └── strategies/ # Estratégias de eliminatória por nº de grupos
│   │   └── utils/              # Logger, errors, helpers
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Componentes de autenticação
│   │   │   ├── etapas/         # Componentes de etapas
│   │   │   ├── jogadores/      # Componentes de jogadores
│   │   │   ├── layout/         # Layout (AdminLayout, etc)
│   │   │   ├── modals/         # Modais reutilizáveis
│   │   │   ├── ui/             # Componentes UI genéricos
│   │   │   └── visualizadores/ # BracketViewer, GruposViewer
│   │   ├── contexts/           # AuthContext, ArenaContext
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/              # Páginas da aplicação
│   │   ├── services/           # Chamadas à API
│   │   ├── types/              # Types TypeScript
│   │   └── utils/              # Utilitários
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
└── README.md
```

## Arquitetura

### Backend

O backend segue os princípios SOLID com arquitetura em camadas:

- **Controllers**: Recebem requisições HTTP e delegam para services
- **Services**: Contêm a lógica de negócio
- **Repositories**: Abstraem o acesso ao banco de dados (Firebase)
- **Middlewares**: Auth, validação, tratamento de erros

#### Padrões Utilizados

- **Repository Pattern**: Interfaces (`IEtapaRepository`, `IJogadorRepository`) com implementações Firebase
- **Strategy Pattern**: Estratégias de eliminatória por número de grupos (TEAMS)
- **Dependency Injection**: Container de serviços (`ServiceContainer`)
- **Error Handling**: Classes de erro customizadas (`AppError`, `ValidationError`, `NotFoundError`)
- **Structured Logging**: Logger profissional com suporte a Cloud Logging

### Frontend

O frontend utiliza React com TypeScript e styled-components:

- **Pages**: Páginas completas da aplicação
- **Components**: Componentes reutilizáveis organizados por domínio
- **Hooks**: Custom hooks para lógica reutilizável
- **Services**: Camada de comunicação com a API
- **Contexts**: Gerenciamento de estado global (Auth, Arena)

## Testes

### Backend

```bash
cd backend

# Rodar testes
npm test

# Rodar testes em watch mode
npm run test:watch

# Gerar coverage
npm run test:coverage
```

### Frontend

```bash
cd frontend

# Rodar testes
npm test

# Rodar testes em watch mode
npm run test:watch

# Gerar coverage
npm run test:coverage
```

### Scripts Disponíveis

#### Backend

| Script                  | Descrição                       |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Iniciar em modo desenvolvimento |
| `npm run build`         | Compilar TypeScript             |
| `npm start`             | Iniciar versão compilada        |
| `npm test`              | Rodar testes                    |
| `npm run test:coverage` | Testes com coverage             |
| `npm run lint`          | Verificar código com ESLint     |
| `npm run lint:fix`      | Corrigir problemas de lint      |

#### Frontend

| Script                  | Descrição                       |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Iniciar em modo desenvolvimento |
| `npm run build`         | Build de produção               |
| `npm run preview`       | Preview do build                |
| `npm test`              | Rodar testes                    |
| `npm run test:coverage` | Testes com coverage             |

## Deploy

### Firebase

O projeto está configurado para deploy no Firebase (Hosting + Functions).

#### URLs de Produção

| Componente | URL                                 |
| ---------- | ----------------------------------- |
| Frontend   | https://torneio-challenge.web.app   |
| Backend    | https://api-ghad5wrd3a-uc.a.run.app |

#### Comandos de Deploy

```bash
# Build do backend
cd backend && npm run build

# Build do frontend
cd frontend && npm run build

# Deploy completo (na raiz do projeto)
firebase deploy

# Deploy apenas do hosting (frontend)
firebase deploy --only hosting

# Deploy apenas das functions (backend)
firebase deploy --only functions
```

#### Configuração

Os arquivos de configuração do Firebase estão na raiz do projeto:

- `.firebaserc` - Projeto Firebase
- `firebase.json` - Configuração de hosting e functions

#### Variáveis de Ambiente em Produção

- **Backend**: Em produção, o Firebase Functions injeta automaticamente as credenciais do Firebase Admin SDK
- **Frontend**: Usar `frontend/.env.production` com `VITE_API_URL=/api`

## Status do Projeto

### Funcionalidades Implementadas

- [x] Sistema de autenticação (Firebase Auth)
- [x] Multi-tenancy (múltiplas arenas)
- [x] CRUD de jogadores
- [x] CRUD de etapas
- [x] Formato Dupla Fixa
- [x] Formato Rei da Praia
- [x] Formato Super X (Super 8, Super 12)
- [x] Formato TEAMS (Teams 4, Teams 6)
- [x] Geração de grupos
- [x] Geração de chaves eliminatórias
- [x] Registro de resultados
- [x] Fase de grupos
- [x] Fase eliminatória
- [x] Cabeças de chave
- [x] Página pública da arena
- [x] Visualizador de grupos (GruposViewer)
- [x] Visualizador de chaves (BracketViewer)
- [x] Rankings
- [x] Testes unitários (backend e frontend)

### Em Desenvolvimento

- [ ] Jogadores se inscrevem sozinhos
- [ ] Sistema de pagamento de inscrições
- [ ] Notificações
- [ ] PWA / Mobile

## Troubleshooting

### Porta já em uso

```bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Erro de CORS

Verificar se `FRONTEND_URL` no backend corresponde à URL do frontend.

### Firebase não conecta

1. Verificar se as variáveis de ambiente estão corretas
2. Verificar se o projeto Firebase existe
3. Verificar se o Firestore está habilitado

## Licença

MIT License

---

**Feito para a comunidade de Beach Tennis**
