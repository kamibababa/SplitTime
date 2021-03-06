namespace splitTime.agent {
    export class PathSpecManager {
        private specs: { [id: string]: PathSpec } = {}

        constructor(
            private readonly defaultPriorityLevel: int = npc.DIRECTED
        ) {}

        register(id: string, setup: SetupFunc): PathSpec {
            const spec = new PathSpec(id, setup)
            this.specs[id] = spec
            return spec
        }

        getSpecById(id: string): PathSpec {
            const spec = this.specs[id]
            assert(!!spec, "Path spec \"" + id + "\" not found")
            return spec
        }
    }
}