FROM node:19.7.0

RUN mkdir /app
COPY . /app

WORKDIR /app

RUN rm -f /app/config.js ; \
    cp /app/config-example.js /app/config.js;  \   
    yarn install  && \
    npm install pm2 -g

VOLUME /app
# ENTRYPOINT [ "pm2", "start", "index.js" ]
ENTRYPOINT [ "node",  "index.js" ]
