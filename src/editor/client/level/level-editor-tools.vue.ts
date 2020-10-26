namespace splitTime.editor.level {

    class CollageViewHelper implements collage.IVueCollageViewHelper {
        _collage: file.Collage | null = null
        _montage: file.collage.Montage | null = null

        constructor(
            private levelEditorShared: LevelEditorShared
        ) {}

        get collage(): file.Collage {
            assert(!!this._collage, "Collage must be set")
            return this._collage
        }

        get selectedMontage(): file.collage.Montage | null {
            return this._montage
        }
        get realCollage(): splitTime.Collage {
            return splitTime.collage.makeCollageFromFile(this.collage, true)
        }
        get server(): client.ServerLiaison {
            return this.levelEditorShared.server
        }
        get time(): game_seconds {
            return this.levelEditorShared.time
        }
        selectMontage(montage: file.collage.Montage): void {
            this._montage = montage
            this.levelEditorShared.selectedMontage = montage.id
            this.levelEditorShared.selectedMontageDirection = montage.direction
        }
    }

    interface VueLevelEditorTools extends client.VueComponent {
        // props
        editorGlobalStuff: client.GlobalEditorShared
        levelEditorShared: LevelEditorShared
        // data
        collageViewHelper: CollageViewHelper
        traceOptions: {
            type: string,
            color: string,
            help: string
        }[]
        // computed
        level: Level
        mode: Mode
        // methods
        selectModeOption(mode: Mode): void
        selectTraceOption(type: string): void
    }

    function data(this: VueLevelEditorTools): Partial<VueLevelEditorTools> {
        return {
            collageViewHelper: new CollageViewHelper(this.levelEditorShared),
            traceOptions: client.traceOptions
        }
    }

    function level(this: VueLevelEditorTools): Level {
        return this.levelEditorShared.level
    }

    function mode(this: VueLevelEditorTools): Mode {
        return this.levelEditorShared.mode
    }

    async function launchCollageFileBrowser(this: VueLevelEditorTools): Promise<void> {
        const filePath = await this.editorGlobalStuff.openFileSelect(COLLAGE_DIR)
        const prefixRegex = new RegExp("^/?" + COLLAGE_DIR + "/?")
        const suffixRegex = /\.json$/
        const collageId = filePath.replace(prefixRegex, "").replace(suffixRegex, "")
        const s = this.levelEditorShared.server
        const collage = await s.api.collageJson.fetch(s.withProject({ collageId }))
        this.levelEditorShared.selectedCollage = collageId
        this.collageViewHelper._collage = collage
        this.collageViewHelper._montage = null
    }
    function selectModeOption(this: VueLevelEditorTools, mode: Mode): void {
        this.levelEditorShared.mode = mode
    }
    function selectTraceOption(this: VueLevelEditorTools, type: string): void {
        this.levelEditorShared.mode = "trace"
        this.levelEditorShared.selectedTraceType = type
    }


    // defer necessary for icons
    defer(() => {
        Vue.component("level-editor-tools", {
            props: {
                editorGlobalStuff: Object,
                levelEditorShared: Object
            },
            data,
            computed: {
                level,
                mode
            },
            methods: {
                launchCollageFileBrowser,
                selectModeOption,
                selectTraceOption
            },
            template: `
<div>
    <label>
        Active Layer:
        <select class="active-layer block" v-model="levelEditorShared.activeLayer">
            <option
                v-for="(layer, index) in levelEditorShared.level.layers"
                :value="index"
            >{{ layer.id || ("Layer " + index) }}</option>
        </select>
    </label>
    <hr/>
    <div style="display: flex; flex-flow: row; justify-content: center;">
        <div :class="{ option: true, active: mode === 'trace' }"
            @click="selectModeOption('trace')"
            title="Traces define areas of interaction within the level.
            &#013;&#013;
            Right-click to create new.&#013;Left-click to add points to started trace.&#013;
            Right-click to close trace (and fill in), or shift+right-click to end trace without filling in.&#013;
            Left-click to drag.&#013;Shift+left-click to clone."
        >
            <i class="fas fa-${TRACE_ICON}"></i>
        </div>
        <div :class="{ option: true, active: mode === 'prop' }"
            @click="selectModeOption('prop')"
            title="Props are loaded on level entrance and are destroyed on level exit.
            &#013;
            Props are generally static (or animated) graphical elements bodies can walk behind or in front of.
            &#013;
            Right-click to create new.&#013;Left-click to drag.&#013;Shift+left-click to clone."
        >
            <i class="fas fa-${PROP_ICON}"></i>
        </div>
        <div :class="{ option: true, active: mode === 'position' }"
            @click="selectModeOption('position')"
            title="Positions are handles for locations that bodies may occupy or paths may lead to and from.
            &#013;&#013;
            Right-click to create new.&#013;Left-click to drag.&#013;Shift+left-click to clone."
        >
            <i class="fas fa-${POSITION_ICON}"></i>
        </div>
    </div>
    <div class="trace-type-options" v-show="mode === 'trace'">
        <div v-for="(traceOption) in traceOptions"
            :key="traceOption.type"
            class="option"
            :style="{ color: 'white', backgroundColor: traceOption.color }"
            @click="selectTraceOption(traceOption.type)"
            :title="traceOption.help"
        >
            {{ traceOption.type }}
        </div>
    </div>
    <div class="collage-tool" v-show="mode === 'prop' || mode === 'position'">
        <input
            :value="levelEditorShared.selectedCollage"
            @dblclick.left="launchCollageFileBrowser"
            placeholder="Select a collage..."
            :readonly="true"
            class="block pointer"
        />
        <collage-showcase
            v-if="collageViewHelper._collage !== null"
            :collage-view-helper="collageViewHelper"
            style="padding: 5px;"
        ></collage-showcase>
    </div>
</div>
            `
        })
    })
}