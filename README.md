# FastDelivery

Prova de conceito da plataforma **FastDelivery** — aplicativo de delivery que integra
clientes, estabelecimentos parceiros e entregadores em um único ambiente digital.

Projeto Integrador — Tecnologia em Análise e Desenvolvimento de Sistemas
Centro Universitário Senac (Santo Amaro) — 2026.

## Autores

- Lucia Vulcano de Andrada
- Thiago Silva Quintino dos Santos
- Nicolas de Sousa Fernandes
- Vicente de Paula da Silva
- Andersson Martins Conserva

## Stack

| Camada              | Tecnologia                                  |
| ------------------- | ------------------------------------------- |
| Frontend (`front/`) | React 18 + TypeScript + Vite + React Router |
| Backend (`back/`)   | NestJS 10 + TypeScript                      |
| ORM                 | Prisma 5                                    |
| Banco de dados      | **PostgreSQL 16**                           |
| Autenticação        | JWT (Bearer) + bcrypt                       |

### Por que PostgreSQL?

- Banco **relacional** open source, aderente ao modelo físico do projeto (chaves
  estrangeiras, tipos `DECIMAL` para valores monetários, enums nativos).
- Suporte de primeira classe no Prisma (migrations versionadas).
- Camada gratuita nos principais provedores de nuvem (Neon, Supabase, Railway,
  Render), o que facilita a publicação da POC para uso público.

## Estrutura

```
fast-delivery-PI-segunda-entrega/
├── docker-compose.yml      # PostgreSQL local
├── back/                   # API NestJS
│   ├── prisma/schema.prisma # modelo físico do banco
│   ├── prisma/seed.ts       # dados de exemplo
│   └── src/
│       ├── auth/            # registro, login, JWT
│       ├── users/           # perfil e endereços
│       ├── restaurants/     # estabelecimentos
│       ├── menu-items/      # cardápio
│       ├── orders/          # pedidos + rastreamento
│       └── health/          # healthcheck
└── front/                  # SPA React
    └── src/
        ├── api/            # cliente HTTP + tipos
        ├── auth/           # contexto de autenticação
        └── pages/          # telas (login, restaurantes, pedido, pedidos)
```

## Como rodar localmente

Pré-requisitos: Node.js 20+, Docker (para o banco).

### 1. Banco de dados

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd back
cp .env.example .env          # ajuste se necessário
npm install
npm run prisma:migrate        # cria as tabelas
npm run db:seed               # popula dados de exemplo
npm run start:dev             # http://localhost:3000/api
```

### 3. Frontend

```bash
cd front
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

### Conta de teste (após o seed)

| Perfil          | E-mail                     | Senha      |
| --------------- | -------------------------- | ---------- |
| Cliente         | `mariana@fastdelivery.dev` | `senha123` |
| Estabelecimento | `carlos@fastdelivery.dev`  | `senha123` |

## Principais endpoints da API

| Método  | Rota                      | Descrição                            |
| ------- | ------------------------- | ------------------------------------ |
| `GET`   | `/api/health`             | Status da API e do banco             |
| `POST`  | `/api/auth/register`      | Cadastro de usuário                  |
| `POST`  | `/api/auth/login`         | Login (retorna JWT)                  |
| `GET`   | `/api/auth/me`            | Dados do usuário autenticado         |
| `GET`   | `/api/restaurants`        | Lista restaurantes (`?category=`)    |
| `GET`   | `/api/restaurants/:id`    | Restaurante + cardápio               |
| `POST`  | `/api/restaurants`        | Cria restaurante (parceiro)          |
| `POST`  | `/api/menu-items`         | Adiciona item ao cardápio            |
| `GET`   | `/api/users/me/addresses` | Endereços do usuário                 |
| `POST`  | `/api/orders`             | Cria pedido                          |
| `GET`   | `/api/orders`             | Pedidos do usuário / do restaurante  |
| `PATCH` | `/api/orders/:id/status`  | Atualiza status + evento de rastreio |

## Publicação em nuvem (gratuita)

Arquitetura: **Render** (PostgreSQL + API NestJS em Docker) → **GitHub Pages**
(frontend React).

### 1. Backend + banco — Render (https://render.com), via Blueprint

1. Subir este repositório no GitHub.
2. No Render: **New > Blueprint** e selecionar o repo. O arquivo
   [`render.yaml`](render.yaml) cria, de uma vez:
   - `fastdelivery-db` — PostgreSQL (plano free);
   - `fastdelivery-api` — API em Docker (plano free), com `DATABASE_URL` já
     conectado ao banco e `JWT_SECRET` gerado automaticamente.
3. A única variável a preencher é **`CORS_ORIGIN`** =
   `https://luciavulcano.github.io` (sem barra no final).
4. No primeiro boot o container roda sozinho `prisma migrate deploy` **e o seed**
   (idempotente), então os dados de teste já ficam disponíveis. A URL fica algo
   como `https://fastdelivery-api.onrender.com`.
5. Testar: abrir `https://fastdelivery-api.onrender.com/api/health` (deve
   responder `{"status":"ok","db":"up"}`).

> **Postgres free do Render expira após 30 dias.** Para um banco gratuito
> permanente, use o **Neon** (https://neon.tech): no `render.yaml`, remova o bloco
> `databases` e a linha `fromDatabase`, marque `DATABASE_URL` como `sync: false` e
> cole a connection string do Neon (com `?sslmode=require`).

> Plano free do Render hiberna após 15 min sem tráfego; a primeira requisição depois
> disso leva ~1 min para responder. Basta abrir a URL uma vez antes de apresentar.

### 2. Frontend — GitHub Pages

1. No repo: **Settings > Pages > Source: GitHub Actions**.
2. **Settings > Secrets and variables > Actions > Variables** (aba _Variables_,
   **não** Secrets) → criar `VITE_API_URL` = `https://fastdelivery-api.onrender.com/api`.
   Sem essa variável o build sai com a URL vazia e o site dá **Erro 404** ao
   listar restaurantes.
3. O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
   builda e publica a cada push em `main` que altere `front/`. O site fica em
   `https://luciavulcano.github.io/fast-delivery-PI-segunda-entrega/`.
4. Confirmar que o `CORS_ORIGIN` no Render bate com esse domínio.

O frontend usa `HashRouter`, então as rotas funcionam no GitHub Pages sem
configuração extra (`.../#/restaurants/...`).

## Modelo físico do banco

O arquivo [`back/prisma/schema.prisma`](back/prisma/schema.prisma) é a fonte de
verdade do modelo físico. Entidades: `User`, `Address`, `Restaurant`, `MenuItem`,
`Courier`, `Order`, `OrderItem`, `Payment`, `TrackingEvent`, `Review`.

Para gerar o diagrama / DDL:

```bash
cd back
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
```
