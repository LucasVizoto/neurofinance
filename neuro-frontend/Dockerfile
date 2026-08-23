FROM node:22-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:3005
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL

RUN npm run build:icons && npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -S neuro && adduser -S neuro -G neuro \
  && apk add --no-cache wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=neuro:neuro /app/package*.json ./
COPY --from=builder --chown=neuro:neuro /app/node_modules ./node_modules
COPY --from=builder --chown=neuro:neuro /app/.next ./.next
COPY --from=builder --chown=neuro:neuro /app/public ./public
COPY --from=builder --chown=neuro:neuro /app/next.config.ts ./

USER neuro

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
