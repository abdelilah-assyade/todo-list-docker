# Stage 1: Build static assets (if using React, Vue, Vite, etc.)
FROM node:22-alpine AS build
WORKDIR /app

FROM nginx:alpine

# Copy static frontend files directly to Nginx web root
COPY . /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]