ARG NODE_IMAGE=node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS migrate-dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && find node_modules -type f -name AGENTS.md -delete

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=https://dasres.com \
    DATABASE_URL=postgresql://build_only:build_only@127.0.0.1:1/build_only?connect_timeout=1
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=dependencies /app/node_modules ./node_modules
COPY app ./app
COPY data ./data
COPY i18n ./i18n
COPY lib ./lib
COPY messages ./messages
COPY public ./public
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY eslint.config.mjs next.config.ts package.json package-lock.json postcss.config.mjs prisma.config.ts proxy.ts tsconfig.json ./
RUN npm run build

FROM ${NODE_IMAGE} AS app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    TMPDIR=/tmp
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 dasres \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin dasres \
    && mkdir -p /app/.next/cache \
    && chown -R 10001:10001 /app /tmp
COPY --from=builder --chown=10001:10001 /app/.next/standalone ./
COPY --from=builder --chown=10001:10001 /app/.next/static ./.next/static
COPY --from=builder --chown=10001:10001 /app/public ./public
USER 10001:10001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/live').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]
CMD ["node", "server.js"]

FROM ${NODE_IMAGE} AS migrate
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=https://dasres.com
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 dasres \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin dasres
COPY --from=migrate-dependencies --chown=10001:10001 /app/node_modules ./node_modules
COPY --chown=10001:10001 package.json prisma.config.ts ./
COPY --chown=10001:10001 lib/env.ts ./lib/env.ts
COPY --chown=10001:10001 prisma/schema.prisma ./prisma/schema.prisma
COPY --chown=10001:10001 prisma/migrations ./prisma/migrations
USER 10001:10001
CMD ["npm", "run", "db:migrate:deploy"]
