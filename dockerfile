# builder stage
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# install deps needed for prisma build
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl netcat gcc g++ python3 make \
  && rm -rf /var/lib/apt/lists/*

# install dependencies (use package-lock.json if present)
COPY package*.json ./
RUN npm ci

# copy app and generate prisma client
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma

# final runtime image
FROM node:20-bullseye-slim
WORKDIR /app

# runtime dependencies for postgres libpq
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libpq5 netcat \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# copy files from builder
COPY --from=builder /app /app

# ensure entrypoint script is executable
RUN chmod +x ./scripts/entrypoint.sh || true

# create non-root user (optional)
RUN useradd --user-group --create-home --shell /bin/false appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["node", "server.js"]