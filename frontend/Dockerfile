# syntax=docker/dockerfile:1

# ---- build stage ----------------------------------------------------------
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so the browser-facing Strapi
# URL must be baked in here (not at runtime). Point it at a host-reachable URL.
ARG NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
ENV NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL

RUN npm run build

# ---- runtime stage --------------------------------------------------------
# Relies on `output: "standalone"` in next.config.ts to emit a minimal server.
FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER node

EXPOSE 3000
CMD ["node", "server.js"]
