FROM node:14-alpine as build-base

RUN apk add --update-cache git python make g++ && rm -rf /var/cache/apk/*
RUN git config --global url."https://github.com/".insteadOf 'ssh://git@github.com/'

WORKDIR /build
COPY package.json package-lock.json ./

FROM build-base as prod-deps-image

RUN npm install --production

FROM prod-deps-image as build-image

RUN npm install
COPY . ./
RUN npm run build

FROM node:14-alpine as runtime

WORKDIR /app

COPY --from=prod-deps-image /build/node_modules/ ./node_modules
COPY --from=build-image /build/dist/ ./dist

EXPOSE 3000
CMD [ "node", "/app/dist/app.js" ]
