# Use official Node.js image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Build argument for Google Maps API key
ARG NEXT_PUBLIC_GOOGLE_API_KEY
ARG NEXT_PUBLIC_USERBACK_KEY

# Make it available during build
ENV NEXT_PUBLIC_GOOGLE_API_KEY=$NEXT_PUBLIC_GOOGLE_API_KEY
ENV NEXT_PUBLIC_USERBACK_KEY=$NEXT_PUBLIC_USERBACK_KEY

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port (default for Next.js)
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
