import { fluentProvide } from "inversify-binding-decorators"

/**
 * A small helper to create an inversify-binding-decorators provider
 * configured with singleton scope.
 *
 * Usage:
 *  @provideSingleton(TYPES.SomeService)
 *  export default class SomeService { ... }
 */
export const provideSingleton = (identifier: any) => fluentProvide(identifier).inSingletonScope().done()

