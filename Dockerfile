FROM python:alpine as build
WORKDIR /tmp
COPY . /tmp
RUN python compile.py

FROM nginx:alpine
COPY --from=build /tmp/bip39-standalone.html /usr/share/nginx/html/index.html

