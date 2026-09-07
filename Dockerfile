# Build this target in CI with: docker build --target verify .
FROM node:24-alpine AS verify

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY server.js ./
COPY scripts ./scripts
COPY test ./test
RUN npm test && npm run build:sea

# Node 24 is the current supported LTS used for all container releases.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --chown=node:node server.js ./

EXPOSE 3000
USER node

CMD ["node", "server.js"]
