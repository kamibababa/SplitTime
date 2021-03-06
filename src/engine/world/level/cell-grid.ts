namespace splitTime.level {
    const PARTITION_SIZE = 32

    /**
     * A class for arranging bodies for collisions
     */
    export class CellGrid {
        private _initialized: boolean
        private _waitingBodies: splitTime.Body[]
        private _whereAreBodies: { [bodyRef: number]: WhereIsBody | undefined }
        private _grids: splitTime.Body[][][]
        _xCells: number
        _yCells: number
        _zCells: number

        constructor(private readonly level: splitTime.Level) {
            this._initialized = false
            this._waitingBodies = []
            this._whereAreBodies = {}
            this._grids = []

            this._xCells = Math.ceil(level.width / PARTITION_SIZE)
            this._yCells = Math.ceil(level.yWidth / PARTITION_SIZE)
            this._zCells = Math.ceil((level.highestLayerZ - level.lowestLayerZ) / PARTITION_SIZE) + 1
            for (var iLayer = 0; iLayer < this._zCells; iLayer++) {
                this._grids[iLayer] = []
                for (
                    var iCell = 0;
                    iCell < this._xCells * this._yCells;
                    iCell++
                ) {
                    this._grids[iLayer][iCell] = []
                }
            }

            this._initialized = true
            for (var i = 0; i < this._waitingBodies.length; i++) {
                this.addBody(this._waitingBodies[i])
            }
        }

        /**
         * Register a body with the organizer (such as on level entrance)
         */
        addBody(body: splitTime.Body) {
            if (this._whereAreBodies[body.ref]) {
                return
            }

            if (!this._initialized) {
                this._waitingBodies.push(body)
                return
            }

            var whereIsBodyNow = new WhereIsBody(this, body)

            for (
                var iZ = whereIsBodyNow.minZCellIndex;
                iZ < whereIsBodyNow.exMaxZCellIndex;
                iZ++
            ) {
                for (
                    var iY = whereIsBodyNow.minYCellIndex;
                    iY < whereIsBodyNow.exMaxYCellIndex;
                    iY++
                ) {
                    for (
                        var iX = whereIsBodyNow.minXCellIndex;
                        iX < whereIsBodyNow.exMaxXCellIndex;
                        iX++
                    ) {
                        var cell = this._grids[iZ][iY * this._xCells + iX]
                        if (splitTime.debug.ENABLED) {
                            for (var i = 0; i < cell.length; i++) {
                                if (cell[i] === body) {
                                    log.warn(
                                        "Body " +
                                            body.ref +
                                            " added to cell more than once"
                                    )
                                    return
                                }
                            }
                        }
                        cell.push(body)
                    }
                }
            }
            this._whereAreBodies[body.ref] = whereIsBodyNow
        }

        /**
         * Deregister a body from the organizer (such as on level exit)
         */
        removeBody(body: splitTime.Body) {
            if (!this._initialized) {
                for (
                    var iBody = this._waitingBodies.length - 1;
                    iBody >= 0;
                    iBody--
                ) {
                    this._waitingBodies.splice(iBody, 1)
                }
                return
            }

            var whereWasBody = this._whereAreBodies[body.ref]
            if (!whereWasBody) {
                return
            }

            for (
                var iZ = whereWasBody.minZCellIndex;
                iZ < whereWasBody.exMaxZCellIndex;
                iZ++
            ) {
                for (
                    var iY = whereWasBody.minYCellIndex;
                    iY < whereWasBody.exMaxYCellIndex;
                    iY++
                ) {
                    for (
                        var iX = whereWasBody.minXCellIndex;
                        iX < whereWasBody.exMaxXCellIndex;
                        iX++
                    ) {
                        var cell = this._grids[iZ][iY * this._xCells + iX]
                        for (var i = 0; i < cell.length; i++) {
                            if (cell[i] === body) {
                                cell.splice(i, 1)
                                break
                            }
                        }
                    }
                }
            }

            this._whereAreBodies[body.ref] = undefined
        }

        /**
         * Force the organizer to resort the body in question.
         * This method assumes all other bodies in the organizer are already sorted.
         * Should be called every time coordinates of body change.
         * @param {splitTime.Body} body
         */
        resort(body: splitTime.Body) {
            if (!this._initialized) {
                return
            }

            var whereWasBody =
                this._whereAreBodies[body.ref] || new WhereIsBody(this)
            var whereIsBodyNow = new WhereIsBody(this, body)

            var me = this
            function removeFromCell(body: Body, x: int, y: int, z: int) {
                var cell = me._grids[z][y * me._xCells + x]
                for (var i = 0; i < cell.length; i++) {
                    if (cell[i] === body) {
                        cell.splice(i, 1)
                        return
                    }
                }
            }

            function addToCell(body: Body, x: int, y: int, z: int) {
                var cell = me._grids[z][y * me._xCells + x]
                if (splitTime.debug.ENABLED) {
                    for (var i = 0; i < cell.length; i++) {
                        if (cell[i] === body) {
                            console.warn(
                                "Body " +
                                    body.ref +
                                    " added to cell more than once"
                            )
                            return
                        }
                    }
                }
                cell.push(body)
            }

            this._adjustCellClaims(
                body,
                whereWasBody,
                whereIsBodyNow,
                removeFromCell
            )
            if (body.baseLength > 0 && body.height > 0) {
                this._adjustCellClaims(
                    body,
                    whereIsBodyNow,
                    whereWasBody,
                    addToCell
                )
            }

            this._whereAreBodies[body.ref] = whereIsBodyNow
        }

        /**
         * Visit all cells in whitelistArea that are not in blacklistArea, calling callback with body and coordinates for each.
         *
         * @param whitelistArea cells to visit
         * @param blacklistArea cells to ignore
         */
        private _adjustCellClaims(
            body: splitTime.Body,
            whitelistArea: WhereIsBody,
            blacklistArea: WhereIsBody,
            callback: (body: splitTime.Body, x: int, y: int, z: int) => void
        ) {
            var iX, iY, iZ

            var whitelistAreaLeftBlacklistExMaxXCellIndex = Math.min(
                whitelistArea.exMaxXCellIndex,
                blacklistArea.minXCellIndex
            )
            var whitelistAreaRightBlacklistMinXCellIndex = Math.max(
                blacklistArea.exMaxXCellIndex,
                whitelistArea.minXCellIndex
            )
            var whitelistAreaTopBlacklistExMaxYCellIndex = Math.min(
                whitelistArea.exMaxYCellIndex,
                blacklistArea.minYCellIndex
            )
            var whitelistAreaBottomBlacklistMinYCellIndex = Math.max(
                blacklistArea.exMaxYCellIndex,
                whitelistArea.minYCellIndex
            )
            var whitelistAreaUnderBlacklistExMaxZCellIndex = Math.min(
                whitelistArea.exMaxZCellIndex,
                blacklistArea.minZCellIndex
            )
            var whitelistAreaAboveBlacklistMinZCellIndex = Math.max(
                blacklistArea.exMaxZCellIndex,
                whitelistArea.minZCellIndex
            )

            // Visit cells in whitelistArea to the bottom (z) of cells in blacklistArea
            for (
                iZ = whitelistArea.minZCellIndex;
                iZ < whitelistAreaUnderBlacklistExMaxZCellIndex;
                iZ++
            ) {
                for (
                    iY = whitelistArea.minYCellIndex;
                    iY < whitelistArea.exMaxYCellIndex;
                    iY++
                ) {
                    for (
                        iX = whitelistArea.minXCellIndex;
                        iX < whitelistArea.exMaxXCellIndex;
                        iX++
                    ) {
                        callback(body, iX, iY, iZ)
                    }
                }
            }
            // Visit cells in whitelistArea to the top (z) of cells in blacklistArea
            for (
                iZ = whitelistAreaAboveBlacklistMinZCellIndex;
                iZ < whitelistArea.exMaxZCellIndex;
                iZ++
            ) {
                for (
                    iY = whitelistArea.minYCellIndex;
                    iY < whitelistArea.exMaxYCellIndex;
                    iY++
                ) {
                    for (
                        iX = whitelistArea.minXCellIndex;
                        iX < whitelistArea.exMaxXCellIndex;
                        iX++
                    ) {
                        callback(body, iX, iY, iZ)
                    }
                }
            }
            // Visit cells in whitelistArea within z range of blacklistArea
            for (
                iZ = whitelistAreaUnderBlacklistExMaxZCellIndex;
                iZ < whitelistAreaAboveBlacklistMinZCellIndex;
                iZ++
            ) {
                // Visit cells in whitelistArea to the top (y) of cells in blacklistArea
                for (
                    iY = whitelistArea.minYCellIndex;
                    iY < whitelistAreaTopBlacklistExMaxYCellIndex;
                    iY++
                ) {
                    for (
                        iX = whitelistArea.minXCellIndex;
                        iX < whitelistArea.exMaxXCellIndex;
                        iX++
                    ) {
                        callback(body, iX, iY, iZ)
                    }
                }
                // Visit cells in whitelistArea to the bottom (y) of cells in blacklistArea
                for (
                    iY = whitelistAreaBottomBlacklistMinYCellIndex;
                    iY < whitelistArea.exMaxYCellIndex;
                    iY++
                ) {
                    for (
                        iX = whitelistArea.minXCellIndex;
                        iX < whitelistArea.exMaxXCellIndex;
                        iX++
                    ) {
                        callback(body, iX, iY, iZ)
                    }
                }
                // Visit cells in whitelistArea within y range of blacklistArea
                for (
                    iY = whitelistAreaTopBlacklistExMaxYCellIndex;
                    iY < whitelistAreaBottomBlacklistMinYCellIndex;
                    iY++
                ) {
                    // Visit cells in whitelistArea to the left of cells in blacklistArea
                    for (
                        iX = whitelistArea.minXCellIndex;
                        iX < whitelistAreaLeftBlacklistExMaxXCellIndex;
                        iX++
                    ) {
                        callback(body, iX, iY, iZ)
                    }
                    // Visit cells in whitelistArea to the right of cells in blacklistArea
                    for (
                        iX = whitelistAreaRightBlacklistMinXCellIndex;
                        iX < whitelistArea.exMaxXCellIndex;
                        iX++
                    ) {
                        callback(body, iX, iY, iZ)
                    }
                    // We should have hit all cases at this point; so don't need the last loop like the other dimensions
                }
            }
        }

        forEachBody(
            minX: number,
            minY: number,
            minZ: number,
            exMaxX: number,
            exMaxY: number,
            exMaxZ: number,
            callback: (arg0: splitTime.Body) => void
        ) {
            var bodiesHit: { [bodyRef: number]: true } = {}
            for (
                var iCellZ = this.getZIndex(minZ);
                iCellZ <= this.getZIndex(exMaxZ);
                iCellZ++
            ) {
                for (
                    var iCellY = this.getYIndex(minY);
                    iCellY <= this.getYIndex(exMaxY);
                    iCellY++
                ) {
                    for (
                        var iCellX = this.getXIndex(minX);
                        iCellX <= this.getXIndex(exMaxX);
                        iCellX++
                    ) {
                        var cell = this._grids[iCellZ][
                            iCellY * this._xCells + iCellX
                        ]
                        for (var iBody = 0; iBody < cell.length; iBody++) {
                            var body = cell[iBody]
                            if (!bodiesHit[body.ref]) {
                                if (
                                    isXOverlap(minX, exMaxX, body) &&
                                    isYOverlap(minY, exMaxY, body) &&
                                    isZOverlap(minZ, exMaxZ, body)
                                ) {
                                    callback(body)
                                }
                            }
                            bodiesHit[body.ref] = true
                        }
                    }
                }
            }
        }

        /**
         * Map real x coordinate to cell x-coordinate
         */
        getXIndex(x: number): int {
            return Math.min(
                Math.max(0, Math.floor(x / PARTITION_SIZE)),
                this._xCells - 1
            )
        }
        /**
         * Map real y coordinate to cell y-coordinate
         */
        getYIndex(y: number): int {
            return Math.min(
                Math.max(0, Math.floor(y / PARTITION_SIZE)),
                this._yCells - 1
            )
        }
        /**
         * Map real z coordinate to cell z-coordinate
         */
        getZIndex(z: number): int {
            return Math.min(
                Math.max(0, Math.floor((z - this.level.lowestLayerZ) / PARTITION_SIZE)),
                this._zCells - 1
            )
        }
    }

    class WhereIsBody {
        readonly minZCellIndex: int
        readonly exMaxZCellIndex: int
        readonly minYCellIndex: int
        readonly exMaxYCellIndex: int
        readonly minXCellIndex: int
        readonly exMaxXCellIndex: int

        constructor(cellGrid: splitTime.level.CellGrid, body?: splitTime.Body) {
            if (body) {
                const left = body.getLeft()
                const right = left + body.baseLength
                const yTop = body.getTopY()
                const yBottom = yTop + body.baseLength
                const zBottom = body.getZ()
                const zTop = zBottom + body.height

                this.minXCellIndex = cellGrid.getXIndex(left)
                this.exMaxXCellIndex = cellGrid.getXIndex(right) + 1
                this.minYCellIndex = cellGrid.getYIndex(yTop)
                this.exMaxYCellIndex = cellGrid.getYIndex(yBottom) + 1
                this.minZCellIndex = cellGrid.getZIndex(zBottom)
                this.exMaxZCellIndex = cellGrid.getZIndex(zTop) + 1
            } else {
                this.minXCellIndex = cellGrid._xCells
                this.exMaxXCellIndex = -1
                this.minYCellIndex = cellGrid._yCells
                this.exMaxYCellIndex = -1
                this.minZCellIndex = cellGrid._zCells
                this.exMaxZCellIndex = -1
            }
        }
    }

    function isXOverlap(minX: number, exMaxX: number, body: Body) {
        var bodyLeft = body.getLeft()
        var noOverlap =
            exMaxX <= bodyLeft || bodyLeft + body.baseLength <= minX
        return !noOverlap
    }

    function isYOverlap(minY: number, exMaxY: number, body: Body) {
        var bodyTop = body.getTopY()
        var noOverlap =
            exMaxY <= bodyTop || bodyTop + body.baseLength <= minY
        return !noOverlap
    }

    function isZOverlap(minZ: number, exMaxZ: number, body: Body) {
        var bodyBottom = body.z
        var noOverlap =
            exMaxZ <= body.z || bodyBottom + body.height <= minZ
        return !noOverlap
    }
}
