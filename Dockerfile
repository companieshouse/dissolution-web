FROM 169942020521.dkr.ecr.eu-west-2.amazonaws.com/base/node-16:alpine-builder
FROM 169942020521.dkr.ecr.eu-west-2.amazonaws.com/base/node-16:alpine-runtime

CMD ["/app/dist/app.js"]

EXPOSE 3000
