namespace splitTime {
    export namespace npc {
        // The levels below are just default suggestions
        /** First-priority e.g. talking / attacking */
        export const PRIORITY = 0
        /** Special but preemptible e.g. path-walking */
        export const DIRECTED = 1
        /** Last-resort behavior e.g. wandering */
        export const IDLE = 2
    }

    export class NpcPriority {
        constructor(
            public readonly npc: Npc,
            public readonly level: int = splitTime.npc.PRIORITY
        ) {}
    }
}