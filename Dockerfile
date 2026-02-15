# Use official Node.js image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /app


# Install ALL dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .


# Build the Next.js app (needs devDependencies)
RUN npm run build

# Remove devDependencies after build (optional, for smaller image)
RUN npm prune --production

# Expose port (default for Next.js)
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
