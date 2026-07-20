# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS build

ENV HUSKY=0 \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/config packages/config
COPY packages/database packages/database
COPY tooling tooling

RUN pnpm --filter @audiomass/database build \
    && pnpm --filter @audiomass/api build \
    && pnpm --filter @audiomass/api --prod deploy --legacy /opt/audiomass-api

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=4000

WORKDIR /srv/audiomass
COPY --from=build --chown=node:node /opt/audiomass-api ./

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
