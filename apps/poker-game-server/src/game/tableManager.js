import PokerEngine from './pokerEngine.js';

class TableManager {
    constructor() {
        this.tables = {};
    }

    createTable(tableId) {
        this.tables[tableId] = new PokerEngine();
    }

    getTable(tableId) {
        return this.tables[tableId];
    }

    removeTable(tableId) {
        delete this.tables[tableId];
    }
}

export default new TableManager();
