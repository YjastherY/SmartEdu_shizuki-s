FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL
ARG VITE_MOCK_API=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MOCK_API=$VITE_MOCK_API

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY vite.config.js ./
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
