import "reflect-metadata";

import { assert } from "chai";
import { Application, RequestHandler } from "express";
import * as sinon from "sinon";

import CustomServerMiddlewareLoader from "app/middleware/customServerMiddlewareLoader.middleware";
import { COMPANY_PATH_PREFIX } from "app/paths";

describe("CustomServerMiddlewareLoader", () => {
    let loader: CustomServerMiddlewareLoader;

    let app: Application;
    let appUseSpy: sinon.SinonSpy;

    let sessionMiddleware: RequestHandler;
    let saveUserEmailToLocals: RequestHandler;
    let authMiddleware: RequestHandler;
    let companyAuthMiddleware: RequestHandler;
    let companyNumberAuthMiddleware: RequestHandler;
    let transactionMiddleware: RequestHandler;

    beforeEach(() => {
        sessionMiddleware = sinon.stub();
        saveUserEmailToLocals = sinon.stub();
        authMiddleware = sinon.stub();
        companyAuthMiddleware = sinon.stub();
        companyNumberAuthMiddleware = sinon.stub();
        transactionMiddleware = sinon.stub();
        appUseSpy = sinon.spy();
        app = { use: appUseSpy } as unknown as Application;

        loader = new CustomServerMiddlewareLoader(
            sessionMiddleware,
            saveUserEmailToLocals,
            authMiddleware,
            companyAuthMiddleware,
            companyNumberAuthMiddleware,
            transactionMiddleware
        );
    });

    describe("loadCustomServerMiddleware", () => {
        it("should register all middlewares in the correct order", () => {
            loader.loadCustomServerMiddleware(app);

            assert.equal(appUseSpy.callCount, 6);
            assert.equal(appUseSpy.args[0][0], sessionMiddleware);
            assert.equal(appUseSpy.args[1][0], authMiddleware);
            assert.equal(appUseSpy.args[2][0], saveUserEmailToLocals);
            assert.equal(appUseSpy.args[3][0], companyAuthMiddleware);

            assert.equal(appUseSpy.args[4][0], COMPANY_PATH_PREFIX);
            assert.equal(appUseSpy.args[4][1], companyNumberAuthMiddleware);
            assert.equal(appUseSpy.args[5][0], `${COMPANY_PATH_PREFIX}/transactions/:transactionId`);
            assert.equal(appUseSpy.args[5][1], transactionMiddleware);
        });
    });
});
