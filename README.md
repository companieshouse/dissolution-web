# Dissolution Web
This repo contains the frontend code for the dissolution web service. It's currenty `WIP`.

## Technologies

- [NodeJS](https://nodejs.org/)
- [ExpressJS](https://expressjs.com/)
- [NunJucks](https://mozilla.github.io/nunjucks)
- [GulpJS](https://gulpjs.com/)
- [Inversify](https://github.com/inversify/)

## Recommendations

We recommend the use of [Visual Studio Code](https://code.visualstudio.com/) for development as it allows the installation of the [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) and the [Nunjucks](https://marketplace.visualstudio.com/items?itemName=ronnidc.nunjucks) plugins. These plugins will make linting of TS and Nunjuck much better than mmost code editors.

IntelliJ does not have a Nunjuck plugin but you can configure IntelliJ to provide syntax highlighting using Twig plugin

## Running locally with Docker  

1. Required tools:
    - [Docker for Mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac)
    - [Docker-Compose](https://docs.docker.com/compose/install/)

2. Once installed, open Docker for Mac and navigate to Preferences -> Resources and change the settings to Memory => 4 GB, CPUs 4, SWAP = 1 GB.

3. Add the following to your `/etc/hosts` file:

    ```
    127.0.0.1 chs-dev cdn.chs-dev account.chs-dev api.chs-dev chs-company-profile-api
    ```

4. Login to the Companies House AWS account and run the following command in a fresh terminal session:

    ```
    $ docker login -u AWS -p "$(aws ecr get-login-password)" https://169942020521.dkr.ecr.eu-west-1.amazonaws.com
    ```

5. Link your GitHub SSH key to to `dissolution-web` directory to access private NPM dependencies in Docker:

    ```
    $ mkdir .ssh
    $ ln ~/.ssh/id_rsa .ssh/id_rsa
    ```
    
6. Clone [Dissolution API](https://github.com/companieshouse/dissolution-api) and ensure you have the following folder structure locally:
    ```
    companies-house
    |- dissolution-web
    |- dissolution-api
    ```

7. Run the following in the `dissolution-web` directory to bring the environment up:

    ```
    $ docker-compose up
    ```

8. Navigate to `http://chs-dev/close-a-company/` to see the landing page

## To make local changes

In the terminal in the `dissolution-web` directory:

1. Stop to service you wish to make changes to

    ```
    $ docker-compose stop dissolution-web
    ```

2. Bring it back up and force the container to rebuild

    ```
    $ docker-compose up --build dissolution-web
    ```