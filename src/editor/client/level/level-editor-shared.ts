namespace splitTime.editor.level {
    export class SharedStuff implements LevelEditorShared {
        activeGroup: int = 0
        readonly collageManager: CollageManager
        mode: Mode = "trace"
        selectedCollage: string = ""
        selectedMontage: string = ""
        selectedMontageDirection: string = ""
        selectedMontageObject: file.collage.Montage | null = null
        selectedTraceType: string = trace.Type.SOLID
        pathInProgress: splitTime.level.file_data.Trace | null = null
        readonly info = {}
        propertiesPaneStuff: client.ObjectProperties

        constructor(
            private editor: VueLevelEditor
        ) {
            this.propertiesPaneStuff = getLevelPropertiesStuff(this.editor.level)
            this.collageManager = new CollageManager(this.server)
        }

        get gridCell(): Vector2D {
            return this.editor.editorGlobalStuff.gridCell
        }

        get gridEnabled(): boolean {
            return this.editor.editorGlobalStuff.gridEnabled
        }

        get level(): Level {
            return this.editor.level
        }

        get server(): client.ServerLiaison {
            return this.editor.editorGlobalStuff.server
        }

        get time(): game_seconds {
            return this.editor.editorGlobalStuff.time
        }

        shouldDragBePrevented(): boolean {
            return this.editor.editorInputs.mouse.isDown || this.pathInProgress !== null
        }

        follow(follower: client.Followable): void {
            this.editor.editorGlobalStuff.setFollowers([follower])
        }
    }
}