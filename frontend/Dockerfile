FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Numéro de version affiché dans le pied de page ; le pipeline le fournit, sinon « dev ».
ARG APP_VERSION=dev
RUN sed -i "s/version: 'dev'/version: '${APP_VERSION}'/" src/app/core/app-info.ts
RUN npm run build

# Image non-root : nginx écoute sur 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
