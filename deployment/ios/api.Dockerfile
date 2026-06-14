FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

EXPOSE 4000

CMD ["pnpm", "--filter", "@russian-wordscodex/api", "exec", "tsx", "src/server.ts"]
