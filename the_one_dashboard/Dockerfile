# Frontend is pre-built locally and committed to the repo (app/dist/).
# This avoids running npm ci + tsc + vite build on every HA add-on install,
# reducing update time from ~2-3 min down to ~20-30 seconds.
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY app/dist ./public
EXPOSE 3000
CMD ["node", "server.js"]
