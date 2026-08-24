FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --chown=node:node src ./src

USER node

EXPOSE 4000

CMD ["npm", "start"]
