FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat \
  && addgroup -S neuro && adduser -S neuro -G neuro

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder --chown=neuro:neuro /app/package*.json ./
COPY --from=builder --chown=neuro:neuro /app/node_modules ./node_modules
COPY --from=builder --chown=neuro:neuro /app/build ./build
COPY --from=builder --chown=neuro:neuro /app/prisma ./prisma
COPY --from=builder --chown=neuro:neuro /app/src/generated ./src/generated

USER neuro

EXPOSE 3001

CMD ["node", "build/server.cjs"]
