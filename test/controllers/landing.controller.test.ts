import "reflect-metadata";

import { assert } from "chai";
import { Application } from "express";
import { OK, MOVED_TEMPORARILY } from "http-status-codes";
import request from "supertest";

import { createApp } from "app/application.factory";
import "app/controllers/landing.controller";
import { ROOT_URI, WHO_TO_TELL_URI } from "app/paths";

const app: Application = createApp();

describe("LandingController", () => {
  describe("GET request", () => {
    it("should render the landing page", async () => {
      const res = await request(app).get(ROOT_URI).expect(OK);
      assert.include(
        res.text,
        "Use this service to apply to close a company, also known as striking a company off the register or dissolution."
      )
    })
  })

  describe("POST request", () => {
    it("should redirect to the who to tell screen upson submission", async () => {
      await request(app)
        .post(ROOT_URI)
        .expect(MOVED_TEMPORARILY)
        .expect("Location", WHO_TO_TELL_URI);
    })
  })
})