import "reflect-metadata"
import { v4 as uuidv4 } from "uuid"
import { provideSingleton } from "app/utils/inversify.decorators"
import TYPES from "app/types"

@provideSingleton(TYPES.UuidGenerator)
export default class UuidGenerator {
    public generate(): string {
        return uuidv4()
    }
}

