FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @russian-wordscodex/web build

FROM nginx:1.27-alpine

COPY deployment/ios/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
