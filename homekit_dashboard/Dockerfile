# Stage 1: Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY app/package*.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# Stage 2: Production — Node.js proxy server + built frontend
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=frontend /frontend/dist ./public
EXPOSE 3000
CMD ["node", "server.js"]
