FROM node:18 

WORKDIR /app

COPY . .
RUN yarn install
RUN yarn run build

CMD ["yarn", "start"]
