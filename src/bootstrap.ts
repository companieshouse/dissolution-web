import * as dotenv from 'dotenv'
import * as tsConfigPaths from 'tsconfig-paths'

tsConfigPaths.register({
    baseUrl: __dirname,
    paths: require(`${__dirname}/tsconfig.json`).compilerOptions.paths
})

const getEnvFile: () => string = () => {
  let envFile = `${__dirname}/../.env`

  if (process.env.NODE_ENV) {
    envFile += `.${process.env.NODE_ENV}`
  }

  return envFile
}

dotenv.config({ path: getEnvFile() })
