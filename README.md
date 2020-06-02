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

## Running locally with Docker  

Required tools:
- [Docker for Mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac)
- [Docker-Compose](https://docs.docker.com/compose/install/)

Once installed, open Docker for Mac and navigate to Preferences -> Resources and change the settings to Memory => 4 GB, CPUs 4, SWAP = 1 GB.

Add `127.0.0.1 chs-dev cdn.chs-dev account.chs-dev` to your `/etc/hosts` file.

Login to the Companies House AWS account and run the following command in a fresh terminal session:

`docker login -u AWS -p "$(aws ecr get-login-password)" https://169942020521.dkr.ecr.eu-west-1.amazonaws.com`

To bring the environment up, run `docker-compose up` in the project folder.

After making local changes to the app, Ctrl+C on the running `docker-compose` terminal session and re-run `docker-compose up` command.

Navigate to `localhost:3000` to see the landing page.
