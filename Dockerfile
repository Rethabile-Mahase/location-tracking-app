# Use official Node.js image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies (bypass peer dependency conflicts)
RUN npm install --legacy-peer-deps --production=false

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port (default for Next.js)
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
