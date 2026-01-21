FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./

RUN addgroup -S app && adduser -S app -G app
USER app

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]