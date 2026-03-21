# Dupley - Sistema de Torneios

Sistema completo para gerenciamento de torneios com suporte a múltiplas arenas.

## Sobre

Dupley é uma plataforma completa para gerenciamento de torneios, permitindo:

- Cadastro de jogadores por categoria e nível
- Quatro formatos de torneio: **Dupla Fixa**, **Rei da Praia**, **Super X** e **TEAMS**
- Geração automática de grupos e chaves eliminatórias (ou manual para Dupla Fixa e TEAMS)
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
- **Tipos de formação de duplas:**
  - **Mesmo Nível**: Sorteio entre jogadores do mesmo nível selecionado
  - **Balanceado**: Pareamento avançado + iniciante (permite todos os níveis)
  - **Manual**: Organizador define as duplas manualmente antes de gerar chaves
- **Suporte a Misto**: Etapas mistas com duplas 1 masculino + 1 feminino
  - Inscrições validam 50% de cada gênero
  - Formação de duplas respeita gênero + nível (balanceado ou mesmo nível)

**Critérios de desempate:** Pontos → Saldo Games → Confronto direto\* → Games vencidos → Sorteio

### Rei da Praia

Jogadores individuais formam duplas rotativas a cada partida dentro de grupos de 4.

- Cada jogador joga 3 partidas com parceiros diferentes
- Fase de grupos + Fase eliminatória com duplas fixas formadas pelos classificados
- Opções de chaveamento: Melhores com Melhores, Pareamento por Ranking, Sorteio Aleatório
- **Suporte a "Todos os níveis"**: Permite jogadores de qualquer nível na mesma etapa

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

- **Multi-arena**: um admin pode gerenciar múltiplas arenas com a mesma conta
- Cadastro e gestão de jogadores (com status ativo/inativo)
- **Importação/Exportação de jogadores via planilha Excel** (.xlsx)
- Criação de etapas com quatro formatos de torneio
- Geração automática de grupos e chaves
- Registro de resultados (placar por games)
- Gerenciamento de cabeças de chave
- Controle de inscrições
- Fase de grupos + Fase eliminatória
- **Substituição de jogadores** após geração de chaves (antes de partidas iniciadas)
- **Edição de jogadores em partidas TEAMS** (antes da partida ser finalizada)
- **Exportação de súmula** (partidas dos grupos) para Excel
- Dashboard com estatísticas

### Para Jogadores/Espectadores

- Visualização de rankings
- Histórico de participações
- Estatísticas individuais
- Acompanhamento de etapas em andamento
- Página pública da arena

## Multi-Arena

Um administrador pode gerenciar múltiplas arenas com a mesma conta. Cada arena tem seus próprios jogadores, etapas e dados completamente isolados.

### Como funciona

- No painel admin, um **seletor de arenas** no menu lateral permite trocar entre arenas
- O botão **"+ Nova Arena"** abre um modal para criar arenas adicionais
- Ao trocar de arena, todos os dados (jogadores, etapas, partidas) são carregados da arena selecionada
- Cada arena tem sua própria página pública com slug único

## Importação/Exportação de Jogadores

Permite importar e exportar jogadores em massa via planilha Excel (.xlsx).

### Exportar

Botão "Exportar" na página de jogadores — baixa um arquivo Excel com todos os jogadores da arena, incluindo: Nome, Email, Telefone, Data de Nascimento, Gênero, Nível, Status e Observações.

### Importar

Botão "Importar" na página de jogadores — abre modal para upload de planilha Excel.

**Colunas obrigatórias:** Nome Completo, Gênero, Nível

**Colunas opcionais:** Email, Telefone, Data de Nascimento, Observações

**Validações:**
- Gênero aceita: Masculino, Feminino, M ou F
- Nível aceita: Iniciante, Intermediário ou Avançado
- Status é definido como Ativo automaticamente
- Nomes duplicados na planilha ou já existentes na arena são rejeitados
- Importação é atômica: se houver erro, nenhum jogador é criado

## Exportação de Súmula

Após gerar as chaves de uma etapa, o botão "Exportar Súmula" fica disponível nas Ações Administrativas. Gera um Excel com as partidas da fase de grupos para impressão.

Disponível para todos os formatos: Dupla Fixa, Rei da Praia, Super X e TEAMS.

## Substituição de Jogadores

Funcionalidade que permite substituir jogadores após a geração de chaves, desde que nenhuma partida tenha sido jogada.

### Como funciona

1. Após gerar as chaves da etapa, o botão "Substituir Jogador" fica disponível
2. Selecione o jogador a ser substituído (coluna esquerda)
3. Selecione o novo jogador (coluna direita)
4. Confirme a substituição

### Regras

- **Só é permitido antes de qualquer partida ser jogada** - Assim que uma partida for registrada, a substituição é bloqueada para todos os jogadores
- **Filtro por gênero** - Somente jogadores do mesmo gênero da etapa são exibidos (exceto etapas mistas)
- **Filtro por nível** - Somente jogadores do mesmo nível são exibidos (exceto formações balanceadas)
- **Jogador substituto não pode estar na etapa** - Só aparecem jogadores que não estão inscritos

### O que é atualizado

| Formato     | Entidades Atualizadas                                 |
| ----------- | ----------------------------------------------------- |
| Dupla Fixa  | Dupla, Partidas, Estatísticas, Inscrições             |
| Rei da Praia| Grupo (duplas), Partidas, Estatísticas, Inscrições    |
| Super X     | Grupo (duplas), Partidas, Estatísticas, Inscrições    |
| TEAMS       | Equipe (jogadores), Partidas, Estatísticas, Inscrições|

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
- Java JDK 11+ (para emuladores Firebase)
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

Copie os arquivos `.env.example` para os respectivos `.env.local`:

```bash
# Backend
cp backend/.env.example backend/.env.local

# Frontend
cp frontend/.env.example frontend/.env.local
```

#### Backend (`backend/.env.local`)

```env
PORT=5000
NODE_ENV=development

# Prefixo FB_ (FIREBASE_ é reservado pelo Firebase Functions)
FB_PROJECT_ID=seu-project-id
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FB_CLIENT_EMAIL=firebase-adminsdk@seu-project.iam.gserviceaccount.com

ALLOWED_ORIGINS=http://localhost:3000
```

#### Frontend (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

VITE_API_URL=http://localhost:5000/api
```

> **Nota**: As variáveis do backend usam prefixo `FB_` em vez de `FIREBASE_` porque o Firebase Functions reserva variáveis com esse prefixo.

## Ambientes

O projeto possui 3 ambientes:

| Ambiente | Frontend | Backend | Banco de Dados |
|----------|----------|---------|----------------|
| **Emuladores (local)** | `localhost:3000` | `localhost:5000` | Emuladores Firebase (dados voláteis) |
| **Staging** | `torneio-challenge-staging.web.app` | Cloud Functions (staging) | Firestore staging |
| **Produção** | `torneio-challenge.web.app` | Cloud Functions (produção) | Firestore produção |

### Fluxo de Trabalho

```
Desenvolvimento local (emuladores)
  → Commit + push na develop
    → CI roda testes + deploy staging automático
      → Valida no staging
        → Merge develop → main
          → Aprovação manual → deploy produção
```

## Executando o Projeto

### Desenvolvimento Local (com emuladores)

Recomendado para desenvolvimento isolado, sem afetar produção.

**Terminal 1** - Emuladores Firebase:
```bash
firebase emulators:start
```

**Terminal 2** - Backend:
```bash
cd backend
npm run dev:emulators
```

**Terminal 3** - Frontend:
```bash
cd frontend
npm run dev:emulators
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Emulator UI: `http://127.0.0.1:4000`

> **Nota**: Os emuladores começam vazios. Crie usuários em `http://127.0.0.1:4000/auth`.

### Desenvolvimento Local (sem emuladores)

Conecta ao Firestore de **staging** (nunca produção). Dados persistem no banco staging.

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

> **Nota**: O `.env.local` do backend e o `.env` do frontend apontam para o projeto staging. Produção só é acessada via deploy (CI/CD).

### Endpoints da API

| Método | Endpoint                                 | Descrição                            |
| ------ | ---------------------------------------- | ------------------------------------ |
| GET    | `/api/health`                            | Health check                         |
| GET    | `/api/arenas`                            | Listar arenas                        |
| GET    | `/api/jogadores`                         | Listar jogadores                     |
| GET    | `/api/etapas`                            | Listar etapas                        |
| GET    | `/api/partidas`                          | Listar partidas                      |
| GET    | `/api/public/arena/:slug`                | Dados públicos da arena              |
| POST   | `/api/etapas/:id/formar-duplas-manual`   | Formar duplas manualmente (Dupla Fixa)|
| POST   | `/api/etapas/:id/substituir-jogador`     | Substituir jogador na etapa          |
| GET    | `/api/etapas/:id/jogadores-disponiveis`  | Jogadores disponíveis p/ substituição|
| GET    | `/api/jogadores/exportar-excel`          | Exportar jogadores para Excel        |
| POST   | `/api/jogadores/importar-excel`          | Importar jogadores de Excel          |
| GET    | `/api/etapas/:id/exportar-sumula`        | Exportar súmula (partidas) para Excel|
| GET    | `/api/arenas/mine`                       | Listar arenas do admin               |
| POST   | `/api/arenas/create-additional`          | Criar arena adicional                |
| PUT    | `/api/arenas/switch/:arenaId`            | Trocar arena ativa                   |

## Estrutura do Projeto

```
challenge-bt/
├── .github/
│   └── workflows/              # CI/CD (GitHub Actions)
│       ├── ci.yml              # Testes e lint
│       ├── deploy-staging.yml  # Deploy automático no staging
│       └── deploy-production.yml # Deploy com aprovação em produção
│
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
│   ├── .env.example            # Template de variáveis de ambiente
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── __tests__/          # Testes unitários
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
│   ├── .env.example            # Template de variáveis de ambiente
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
├── .firebaserc                 # Projetos Firebase (default + staging)
├── firebase.json               # Config hosting, functions, emuladores
├── firestore.rules             # Regras de segurança do Firestore
├── firestore.indexes.json      # Índices compostos do Firestore
├── storage.rules               # Regras de segurança do Storage
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

| Script                    | Descrição                                  |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Iniciar em modo desenvolvimento            |
| `npm run dev:emulators`   | Iniciar conectado aos emuladores Firebase  |
| `npm run dev:staging`     | Iniciar com config de staging              |
| `npm run build`           | Compilar TypeScript                        |
| `npm start`               | Iniciar versão compilada                   |
| `npm test`                | Rodar testes                               |
| `npm run test:coverage`   | Testes com coverage                        |
| `npm run test:ci`         | Testes para CI (sem watch)                 |
| `npm run lint`            | Verificar código com ESLint                |
| `npm run lint:fix`        | Corrigir problemas de lint                 |
| `npm run deploy:staging`  | Build + deploy no staging                  |
| `npm run deploy:prod`     | Build + deploy em produção                 |

#### Frontend

| Script                    | Descrição                                  |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Iniciar em modo desenvolvimento            |
| `npm run dev:emulators`   | Iniciar com emuladores Firebase            |
| `npm run build`           | Build de produção                          |
| `npm run build:staging`   | Build para staging                         |
| `npm run preview`         | Preview do build                           |
| `npm test`                | Rodar testes                               |
| `npm run test:coverage`   | Testes com coverage                        |
| `npm run deploy:staging`  | Build staging + deploy                     |
| `npm run deploy:prod`     | Build produção + deploy                    |

## Deploy

### CI/CD (GitHub Actions)

O deploy é automatizado via GitHub Actions:

| Workflow | Trigger | Ambiente | Aprovação |
|----------|---------|----------|-----------|
| CI - Testes e Lint | Push `develop` / PRs | - | Automática |
| Deploy Staging | Push `develop` | Staging | Automática |
| Deploy Produção | Push `main` | Produção | Manual (reviewer) |

Os secrets estão configurados nos **GitHub Environments** (`staging` e `production`).

### Deploy Manual

```bash
# Deploy para staging
firebase use staging
cd backend && npm run build && cd ..
cd frontend && npm run build:staging && cd ..
firebase deploy

# Deploy para produção
firebase use default
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
firebase deploy
```

### Configuração Firebase

| Arquivo | Descrição |
|---------|-----------|
| `.firebaserc` | Projetos Firebase (default + staging) |
| `firebase.json` | Hosting, Functions, Emuladores, Firestore, Storage |
| `firestore.rules` | Regras de segurança do Firestore |
| `firestore.indexes.json` | Índices compostos do Firestore |
| `storage.rules` | Regras de segurança do Storage |

### Variáveis de Ambiente em Produção

- **Backend**: Firebase Functions injeta credenciais automaticamente. Variáveis extras são lidas do `.env.staging` ou `.env.production` pelo Firebase Functions.
- **Frontend**: Build com `--mode staging` ou `--mode production` carrega o `.env` correspondente. `VITE_API_URL=/api` usa o rewrite do Firebase Hosting.

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
- [x] Formação manual de duplas (Dupla Fixa)
- [x] Substituição de jogadores (todos os formatos)
- [x] Edição de jogadores em partidas TEAMS
- [x] Importação/Exportação de jogadores via Excel
- [x] Exportação de súmula (partidas dos grupos) para Excel
- [x] Multi-arena (um admin gerencia múltiplas arenas)
- [x] Testes unitários (backend e frontend)
- [x] Ambientes staging + produção com CI/CD

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

Verificar se `ALLOWED_ORIGINS` no `.env.local` do backend inclui a URL do frontend.

### Firebase não conecta

1. Verificar se as variáveis de ambiente estão corretas (`FB_PROJECT_ID`, `FB_PRIVATE_KEY`, `FB_CLIENT_EMAIL`)
2. Verificar se o projeto Firebase existe
3. Verificar se o Firestore está habilitado

### Emuladores não iniciam

1. Verificar se o Java está instalado: `java -version` (JDK 11+)
2. Verificar se o Firebase CLI está atualizado: `firebase --version`
3. Verificar se `storage.rules` existe na raiz do projeto

### Deploy falha no GitHub Actions

1. Verificar se os secrets estão configurados nos Environments (`staging` / `production`)
2. Verificar se a service account tem role **Editor** no IAM do projeto
3. Verificar se as APIs necessárias estão habilitadas (Cloud Functions, Cloud Build, Cloud Billing)

## Licença

MIT License

---

**Feito para a comunidade**
