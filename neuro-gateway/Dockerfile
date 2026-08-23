FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -S neuro && adduser -S neuro -G neuro

ENV NODE_ENV=production
ENV PORT=3005

COPY --from=builder --chown=neuro:neuro /app/package*.json ./
COPY --from=builder --chown=neuro:neuro /app/node_modules ./node_modules
COPY --from=builder --chown=neuro:neuro /app/dist ./dist

USER neuro

EXPOSE 3005

CMD ["node", "dist/main.js"]
