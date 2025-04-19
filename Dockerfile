
# Build stage - using multi-platform node image
FROM --platform=$BUILDPLATFORM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage - using multi-platform nginx image
FROM --platform=$TARGETPLATFORM nginx:alpine AS production

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create volume mount point
VOLUME /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
