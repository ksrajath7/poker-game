import PokerEngine from './pokerEngine.js';

class TableManager {
    constructor() {
        this.tables = {};
    }

    createTable(tableId, ownerId) {
        this.tables[tableId] = new PokerEngine(ownerId);
    }

    getTable(tableId) {
        return this.tables[tableId];
    }

    removeTable(tableId) {
        delete this.tables[tableId];
    }
}

export default new TableManager();
