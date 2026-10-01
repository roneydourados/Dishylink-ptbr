# Browser-only Painel Órbita: SPA + historian + LAN/cloud proxies.
# Architecture-neutral base; compose does not pass --platform, so the image
# is this machine only (amd64 or arm64), never a multi-arch manifest. The
# host must be on the Starlink LAN. Docker Desktop has no real --network
# host, so the container reaches the dish and router through the host's
# IPv4 NAT.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HISTORIAN_EMBED=1
ENV HISTORIAN_DATA_DIR=/data
ENV HISTORIAN_PROTOSET=/app/public/dish.protoset
ENV BROWSER_DIST=/app/dist
ENV BROWSER_HOST_PORT=8080
# /app is root-owned; only /data is writable by the painelorbita user this
# process runs as, and it's already the persistent volume.
ENV STARLINK_COOKIE_FILE=/data/.starlink-cookie

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 painelorbita \
  && useradd --system --uid 1001 --gid painelorbita --home-dir /app --no-create-home painelorbita \
  && mkdir -p /data \
  && chown painelorbita:painelorbita /data

# Runtime only needs the historian's protobuf decoder, tsx to load the .mts
# tree, and undici for the cloud handler's resilient fetch. A stub package.json
# keeps those files ESM; the monorepo lockfile is not reused here because it
# would pull Electron and the renderer into the image.
RUN printf '%s\n' '{"name":"painel-orbita-browser","private":true,"type":"module"}' > package.json \
  && npm install --omit=dev --ignore-scripts @bufbuild/protobuf@2.6.0 tsx@4.23.1 undici@7.29.0

COPY --from=build --chown=painelorbita:painelorbita /app/dist ./dist
COPY --from=build --chown=painelorbita:painelorbita /app/public/dish.protoset ./public/dish.protoset
COPY --chown=painelorbita:painelorbita collector ./collector
COPY --chown=painelorbita:painelorbita core ./core
COPY --chown=painelorbita:painelorbita cloud ./cloud
COPY --chown=painelorbita:painelorbita docker ./docker
COPY --chown=painelorbita:painelorbita dev/starlinkCloudProxy.ts ./dev/starlinkCloudProxy.ts

USER painelorbita
EXPOSE 8080
VOLUME /data
# lastWrittenMinute is the recorder's newest persisted minute, in epoch seconds.
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then((r)=>r.ok?r.json():Promise.reject(new Error('unhealthy'))).then((h)=>process.exit(Date.now()/1000-h.lastWrittenMinute<180?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--import", "tsx", "docker/browserHost.mts"]
