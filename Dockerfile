FROM node:18-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY . .

RUN mkdir -p uploads/products uploads/categories uploads/banners uploads/avatars logs

EXPOSE 5000

CMD ["node", "src/server.js"]
