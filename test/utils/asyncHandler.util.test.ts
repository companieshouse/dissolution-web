import "reflect-metadata";

import { assert } from "chai";
import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sinon from "sinon";
import request from "supertest";

import { runAsync } from "app/utils/asyncHandler";

const flushPromises = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe("runAsync", () => {
    let req: Request;
    let res: Response;
    let next: sinon.SinonSpy;

    beforeEach(() => {
        req = {} as Request;
        res = {} as Response;
        next = sinon.spy();
    });

    describe("unit", () => {
        it("when wrapped then returns a function with the Express handler arity", () => {
            const handler = runAsync(async () => {});

            assert.isFunction(handler);
            assert.equal(handler.length, 3);
        });

        it("when invoked then calls the wrapped handler with req, res and next", async () => {
            const fn = sinon.stub().resolves();

            runAsync(fn)(req, res, next);
            await flushPromises();

            assert.isTrue(fn.calledOnceWithExactly(req, res, next));
        });

        it("when invoked then returns undefined rather than the promise", () => {
            const result = runAsync(async () => {})(req, res, next);

            assert.isUndefined(result);
        });

        it("when the handler resolves then does not call next", async () => {
            runAsync(async () => {})(req, res, next);
            await flushPromises();

            assert.isTrue(next.notCalled);
        });

        it("when the handler throws then passes the error to next", async () => {
            const error = new Error("boom");

            runAsync(async () => {
                throw error;
            })(req, res, next);
            await flushPromises();

            assert.isTrue(next.calledOnceWithExactly(error));
        });

        it("when the handler rejects then passes the rejection reason to next", async () => {
            const error = new Error("rejected");

            runAsync(() => Promise.reject(error))(req, res, next);
            await flushPromises();

            assert.isTrue(next.calledOnceWithExactly(error));
        });

        it("when the handler rejects with a non-Error value then passes it to next unchanged", async () => {
            runAsync(() => Promise.reject("string reason"))(req, res, next);
            await flushPromises();

            assert.isTrue(next.calledOnceWithExactly("string reason"));
        });

        it("when the handler throws after an await then passes the error to next", async () => {
            const error = new Error("late");

            runAsync(async () => {
                await Promise.resolve();
                throw error;
            })(req, res, next);
            await flushPromises();

            assert.isTrue(next.calledOnceWithExactly(error));
        });

        it("when the handler calls next itself then next is only called by the handler", async () => {
            runAsync(async (_req: Request, _res: Response, n: NextFunction) => {
                n();
            })(req, res, next);
            await flushPromises();

            assert.isTrue(next.calledOnceWithExactly());
        });
    });

    describe("with Express", () => {
        const buildApp = (handler: ReturnType<typeof runAsync>) => {
            const app = express();
            app.get("/test", handler);
            app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`handled: ${err.message}`);
            });
            return app;
        };

        it("when the handler resolves then sends its response", async () => {
            const app = buildApp(
                runAsync(async (_req, res) => {
                    res.status(StatusCodes.OK).send("ok");
                })
            );

            const res = await request(app).get("/test");

            assert.equal(res.status, StatusCodes.OK);
            assert.equal(res.text, "ok");
        });

        it("when the handler rejects then the error middleware handles it instead of the request hanging", async () => {
            const app = buildApp(
                runAsync(async () => {
                    throw new Error("async failure");
                })
            );

            const res = await request(app).get("/test");

            assert.equal(res.status, StatusCodes.INTERNAL_SERVER_ERROR);
            assert.equal(res.text, "handled: async failure");
        });

        it("when used as middleware and it calls next then the chain continues", async () => {
            const app = express();
            app.get(
                "/test",
                runAsync(async (_req, res, next) => {
                    res.locals.flag = "set";
                    next();
                }),
                (_req, res) => {
                    res.send(res.locals.flag);
                }
            );

            const res = await request(app).get("/test");

            assert.equal(res.text, "set");
        });
    });
});
