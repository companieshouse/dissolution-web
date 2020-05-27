# Node Skeleton Frontend
This repo contains a skeleton Companies House NodeJS frontend project.

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
2. Make sure you have Node installed (Node 12 with NVM (node version manager) recommended)
3. `npm install`
4. Change line 27 in .env.vagrant file - `CDN_HOST=chs-dev.internal:8080` to `CDN_HOST=assets`
6. Change 3 lines in layout.njk from `//{{ cdn.host }}` -> `{{ cdn.host }}` (just remove //)
7. `npm run build`
8. Clone this repo - https://github.com/companieshouse/cdn.ch.gov.uk
9. Copy the `app/assets` folder and place it in `dissolution-web/dist/assets`
10. `npm run start`
11. Navigate to `localhost:3000`
12. You should see the landing page

If you want to make a change:

1. Stop the server
2. Make change
3. npm run build
4. npm run start