# Dissolution Web
This repo contains the frontend code for the dissolution web service. It's currenty `WIP`.

## Technologies

- [NodeJS](https://nodejs.org/)
- [ExpressJS](https://expressjs.com/)
- [NunJucks](https://mozilla.github.io/nunjucks)
- [GulpJS](https://gulpjs.com/)
- [Inversify](https://github.com/inversify/)

## Recommendations

We recommend the use of Visual Studio Code for development as it allows the installation of the TSLint and the Nunjucks plugins. These plugins will make linting of TS and Nunjuck much better than mmost code editors.

IntelliJ does not have a Nunjuck plugin but you can configure IntelliJ to provide syntax highlighting using Twig plugin

## How to run it

1. Clone the repository
2. Run `docker-compose up`
3. Navigate to `localhost:3000`
4. You should see the landing page

If you want to make a change:

1. CTRL-C to stop the docker-compose process
2. Run `docker-compose up`