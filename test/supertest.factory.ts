import { Application } from 'express'
import supertest from 'supertest'

export const setupSuperTest = (app: Application) => {
  // Insert generic supertest configuration here

  return supertest(app)
}