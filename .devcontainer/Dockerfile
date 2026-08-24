FROM node:22-slim

# Let corepack install the pnpm version pinned in package.json on first use
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

RUN apt-get update && apt-get install -y \
  sudo \
  git

# Add node user to sudoers for development container (password-less sudo)
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN mkdir -p /home/node/.claude /home/node/.config/gh && chown -R node:node /home/node/.claude /home/node/.config
