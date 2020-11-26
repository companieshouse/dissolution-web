FROM 169942020521.dkr.ecr.eu-west-1.amazonaws.com/base/node:14-alpine-builder

FROM 169942020521.dkr.ecr.eu-west-1.amazonaws.com/base/node:14-alpine-runtime

EXPOSE 3000
EXPOSE 9229

CMD ["--inspect=0.0.0.0:9229", "--nolazy", "dist/app.js"]