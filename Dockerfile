FROM node:20-alpine

WORKDIR /app

# Copy config files first for better layer caching
COPY package.json package-lock.json ./
COPY postcss.config.mjs tailwind.config.ts ./

# Install dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Set environment variable for production
ENV NODE_ENV=production

# Build the Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]