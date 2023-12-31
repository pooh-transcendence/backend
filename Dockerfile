FROM node:18-alpine

WORKDIR /app
COPY ./ .
RUN apk update && apk upgrade && apk add bash vim --no-cache
RUN npm i -g @nestjs/cli

#CMD ["npm", "run", "start:dev"]
#CMD ["sleep", "infinity"]

CMD npm install; npm run start:dev; sleep infinity; 
