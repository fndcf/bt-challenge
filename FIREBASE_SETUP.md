# 🔥 Configuração do Firebase

Este guia explica como configurar o Firebase para o projeto Challenge BT.

## 📋 Pré-requisitos

1. Conta no [Firebase Console](https://console.firebase.google.com/)
2. Node.js instalado (v18+)

## 🚀 Passo a Passo

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `challenge-bt` (ou outro nome de sua preferência)
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2. Configurar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Modo de produção"** (configuraremos regras depois)
4. Selecione a localização: **`southamerica-east1 (São Paulo)`**
5. Clique em "Ativar"

### 3. Configurar Authentication

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Começar"**
3. Ative o método **"E-mail/senha"**
4. Salve as configurações

### 4. Obter Credenciais do Backend (Admin SDK)

1. No menu lateral, clique no ícone de **engrenagem** ⚙️ > **"Configurações do projeto"**
2. Vá para a aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"**
4. Salve o arquivo JSON baixado (não compartilhe este arquivo!)
5. Abra o arquivo JSON e copie os valores:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 5. Obter Credenciais do Frontend (Client SDK)

1. Ainda em **"Configurações do projeto"**
2. Role para baixo até **"Seus aplicativos"**
3. Clique no ícone **Web** `</>`
4. Registre o app com o nome: `challenge-bt-web`
5. Copie o objeto `firebaseConfig` que aparecerá
6. Use os valores para preencher as variáveis do frontend

### 6. Configurar Variáveis de Ambiente

#### Backend (.env)

```bash
# Copiar o arquivo de exemplo
cp backend/.env.example backend/.env

# Editar o arquivo backend/.env com suas credenciais:
PORT=5000
NODE_ENV=development

FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project.iam.gserviceaccount.com

ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=sua-chave-secreta-aqui
```

#### Frontend (.env)

```bash
# Copiar o arquivo de exemplo
cp frontend/.env.example frontend/.env

# Editar o arquivo frontend/.env:
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=seu-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

VITE_API_URL=http://localhost:5000/api
```

### 7. Configurar Regras do Firestore

1. No Firestore Database, clique na aba **"Regras"**
2. Cole as regras do arquivo `backend/src/config/firestore.ts`
3. Clique em "Publicar"

### 8. Criar Índices Compostos (Importante!)

Alguns índices serão criados automaticamente quando necessário, mas você pode criá-los manualmente:

1. No Firestore, vá para a aba **"Índices"**
2. Clique em **"Adicionar índice"**
3. Crie os índices conforme definido em `FIRESTORE_INDEXES` no arquivo `firestore.ts`

### 9. Configurar Storage (Opcional)

Se precisar armazenar imagens/documentos:

1. No menu lateral, clique em **"Storage"**
2. Clique em **"Começar"**
3. Escolha as regras de segurança
4. Escolha a localização (mesma do Firestore)

## ✅ Verificar Configuração

Execute o backend:

```bash
cd backend
npm install
npm run dev
```

Se ver a mensagem `✅ Firebase Admin inicializado com sucesso`, está tudo certo!

Execute o frontend:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000` e verifique se não há erros no console.

## 🔐 Segurança

⚠️ **IMPORTANTE:**

- Nunca commite arquivos `.env` no Git
- Nunca compartilhe suas chaves privadas
- Use variáveis de ambiente em produção
- Ative regras de segurança no Firestore

## 🆘 Problemas Comuns

### Erro: "Firebase Admin not initialized"

→ Verifique se o arquivo `.env` está na pasta correta e as variáveis estão preenchidas

### Erro: "Permission denied"

→ Verifique as regras de segurança do Firestore

### Erro: "Invalid API key"

→ Verifique se copiou corretamente as credenciais do frontend

## 📚 Documentação Oficial

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guides](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
