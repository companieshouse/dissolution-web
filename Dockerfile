FROM 416670754337.dkr.ecr.eu-west-2.amazonaws.com/local/configure-local-ssh
FROM 416670754337.dkr.ecr.eu-west-2.amazonaws.com/ci-node-runtime-18

COPY --from=0 ./ ./
RUN dnf install -y tar

WORKDIR /opt
COPY dist ./dist
COPY ./package.json ./package-lock.json docker_start.sh routes.yaml ./

CMD ["./docker_start.sh"]

EXPOSE 3000
