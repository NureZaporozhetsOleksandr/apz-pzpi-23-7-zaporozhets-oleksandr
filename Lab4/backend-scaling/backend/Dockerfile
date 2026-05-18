FROM node:20-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY final-project/package*.json ./

RUN npm install

COPY final-project ./

EXPOSE 3000

CMD ["npm", "start"]