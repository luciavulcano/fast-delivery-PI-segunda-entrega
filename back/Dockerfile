# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
# openssl é exigido pelo Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# node_modules do estágio de build já traz o Prisma Client gerado + a CLI do Prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
# aplica as migrations e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
