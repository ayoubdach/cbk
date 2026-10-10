FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./server.js
COPY public ./public
RUN mkdir -p /app/data && chown -R node:node /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_PATH=/app/data/gym.db

USER node
EXPOSE 3000

CMD ["npm", "start"]
