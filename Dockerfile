FROM node:18-alpine

WORKDIR /app
RUN apk update && apk upgrade && apk add bash vim --no-cache
RUN npm i -g @nestjs/cli

#CMD ["npm", "run", "start:dev"]
CMD ["sleep", "infinity"]

