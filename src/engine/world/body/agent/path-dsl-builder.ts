namespace splitTime.agent {
    export class Walk {
        constructor(
            public readonly location: Readonly<Coordinates2D> | Readonly<Coordinates3D>,
            public readonly options: WalkOptions | null = null
        ) {}
    }

    export class PathDslBuilder implements PathDsl {
        private steps: (Walk | ILevelLocation2 | time.MidEventAction)[] = [];

        constructor(

        ) {
            
        }

        walk(location: Readonly<Coordinates2D> | Readonly<Coordinates3D>, options?: WalkOptions): void {
            this.steps.push(new Walk(location, options))
        }
        transport(location: ILevelLocation2): void {
            this.steps.push(location)
        }
        do(action: time.MidEventCallback): void {
            this.steps.push(new time.MidEventAction(action))
        }

        build(): readonly (Walk | ILevelLocation2 | time.MidEventAction)[] {
            return this.steps
        }
    }
}