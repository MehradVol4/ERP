# syntax=docker/dockerfile:1

# ---- build stage ----------------------------------------------------------
# Debian slim so native modules (better-sqlite3) compile without extra fuss.
FROM node:20-slim AS build

# Build tools required to compile native deps during `npm ci`.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Install deps first so this layer is cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest and build the admin panel + server (outputs to dist/).
COPY . .
RUN npm run build

# ---- runtime stage --------------------------------------------------------
FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337

# Bring over the fully built app (node_modules already compiled in build stage).
COPY --from=build /app ./

# Run as the unprivileged user that the node image already provides.
RUN chown -R node:node /app
USER node

EXPOSE 1337
CMD ["npm", "run", "start"]
