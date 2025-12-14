# client/Dockerfile
FROM node:22.17.1-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite port
EXPOSE 5173

# Start Vite with --host to allow Docker access
CMD ["npm", "run", "dev", "--", "--host"]