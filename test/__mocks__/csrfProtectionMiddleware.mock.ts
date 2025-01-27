const webSecurity = require("@companieshouse/web-security-node")
const sinon = require("sinon")

const mockCsrfMiddleware = sinon.createSandbox()
mockCsrfMiddleware.replaceGetter(webSecurity, "CsrfProtectionMiddleware", (options: any) => (req: any, res: any, next: any) => {
    return next()
})

export default mockCsrfMiddleware
