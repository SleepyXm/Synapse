# syntax=docker/dockerfile:1

FROM golang:1.25-bookworm AS go-build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY knowledge ./knowledge
COPY cmd/knowledge-service ./cmd/knowledge-service
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/synapse-knowledge ./cmd/knowledge-service

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 synapse \
    && useradd --uid 10001 --gid synapse --no-create-home --shell /usr/sbin/nologin synapse \
    && mkdir -p /var/lib/synapse/knowledge \
    && chown -R synapse:synapse /var/lib/synapse

WORKDIR /app
ENV GIN_MODE=release \
    KNOWLEDGE_DIR=/var/lib/synapse/knowledge
USER synapse

COPY --from=go-build --chown=synapse:synapse /out/synapse-knowledge /usr/local/bin/synapse-knowledge
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/synapse-knowledge"]
