FROM node:alpine AS base

# Install dependencies only when needed
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY ./package.json ./yarn.lock ./

    RUN \
    if [ -f package.json ]; then yarn install --only=production && yarn cache clean --force; \
    else echo "No package.json found, exiting..." && exit 1; \
    fi

RUN yarn install --dev @nestjs/cli

# Build the app
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY ./ .

RUN yarn run build

RUN rm -rf ./src

USER node

# Build for development
FROM base AS development

WORKDIR /app

ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json .
COPY --from=builder /app/yarn.lock .
COPY --from=builder /app/.env.* .
COPY --from=builder /app/tsconfig*.json .

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]