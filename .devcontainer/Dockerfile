FROM oven/bun:latest

RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    ca-certificates \
    git \
    nano \
    vim-tiny \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER bun