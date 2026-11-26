# Multi-stage production Dockerfile for Next.js on Google Cloud Run
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bespoke/platform build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/platform/public ./apps/platform/public
COPY --from=builder /app/apps/platform/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/.next/static ./apps/platform/.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "apps/platform/server.js"]
