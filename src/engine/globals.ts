// Note: TypeScript can't enforce integers; so tread with caution
type int = number

function assert(condition: boolean, message: string): asserts condition {
    if(!condition) {
        throw new Error(message)
    }
}
