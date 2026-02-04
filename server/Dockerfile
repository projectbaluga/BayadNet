FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
# Best practice: use a non-root user
USER node
CMD ["node", "index.js"]
