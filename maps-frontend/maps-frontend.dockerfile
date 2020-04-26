FROM node:12-alpine as builder

# create the app directory
WORKDIR /usr/src/app

# copy the dependencies package into the app directory
COPY package.json .
COPY yarn.lock .

# install the dependencies
RUN yarn install

# copy the app into the app directory
COPY . .

# build the app
RUN yarn build

FROM nginx:alpine 

# copy the built directory to nginx image
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
COPY conf/nginx-ui-production.conf /etc/nginx/conf.d/default.conf
