
# Builder stage: build with all dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage: only production dependencies and built output
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production --legacy-peer-deps
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/app ./app
EXPOSE 3000
CMD ["npm", "start"]

# Expose port (default for Next.js)
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
