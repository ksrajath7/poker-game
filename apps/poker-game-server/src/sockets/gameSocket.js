import tableManager from '../game/tableManager.js';

export default (io) => {
    io.on('connection', (socket) => {

        // -------------------------------
        // HELPER: Sync Table State to All Players
        // -------------------------------
        function syncTableToAll(table) {
            table.players.forEach(player => {
                io.to(player.socketId).emit('tableDetails', table.getDetails(player.userId));
            });
        }

        // -------------------------------
        // HELPER: Add or Reconnect Player to Table
        // -------------------------------
        function addPlayerToTable({ tableId, socketId, userId, username }) {
            const table = tableManager.getTable(tableId);
            if (!table) return false;

            const existingPlayer = table.players.find(p => p.userId === userId);
            if (existingPlayer) {
                // Reconnecting: update socketId
                existingPlayer.socketId = socketId;
            } else {
                // New player
                table.addPlayer({ socketId, userId, username });
            }

            socket.join(tableId);

            // Send full table state (with THEIR cards visible)
            io.to(socketId).emit('joinedTable', {
                tableId,
                table: table.getDetails(userId)
            });

            // Notify others someone joined/reconnected
            socket.to(tableId).emit('playerJoined', {
                userId,
                players: table.getDetails().players // Hidden cards for others
            });

            syncTableToAll(table);
            return true;
        }

        // -------------------------------
        // HELPER: Remove Player from Table
        // -------------------------------
        function removePlayerFromTable({ tableId, userId }) {
            const table = tableManager.getTable(tableId);
            if (!table) return false;

            const removed = table.removePlayer(userId);
            if (!removed) return false;

            io.to(removed.socketId).emit('removedFromTable', {
                tableId,
                message: 'You have been removed from the table.'
            });

            io.in(tableId).emit('playerLeft', {
                userId,
                players: table.getDetails().players
            });

            syncTableToAll(table);
            return true;
        }

        // -------------------------------
        // SOCKET EVENTS
        // -------------------------------

        socket.on('createTable', ({ userId, username }) => {
            const tableId = Math.floor(100000 + Math.random() * 900000);
            if (tableManager.getTable(tableId)) {
                io.to(socket.id).emit('tableExists', { tableId });
                return;
            }

            tableManager.createTable(tableId);
            addPlayerToTable({ tableId, socketId: socket.id, userId, username });

            io.to(socket.id).emit('tableCreated', {
                tableId,
                table: tableManager.getTable(tableId).getDetails(userId)
            });
        });

        socket.on('joinTable', ({ tableId, userId, username }) => {
            const success = addPlayerToTable({ tableId, socketId: socket.id, userId, username });
            if (!success) io.to(socket.id).emit('error', { message: 'Table does not exist' });
        });

        socket.on('getTableDetails', ({ tableId, userId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) {
                io.to(socket.id).emit('error', { message: 'Table not found' });
                return;
            }
            io.to(socket.id).emit('tableDetails', table.getDetails(userId));
        });

        socket.on('startGame', ({ tableId, userId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return io.to(socket.id).emit('error', { message: 'Table not found' });

            const player = table.players.find(p => p.userId === userId);
            if (!player) return io.to(socket.id).emit('error', { message: 'You are not part of this table' });

            table.startGame();

            // Send private hand to each player
            table.players.forEach(p => {
                io.to(p.socketId).emit('yourHand', { hand: p.hand });
            });

            // Notify everyone game started
            io.in(tableId).emit('gameStarted', { startedBy: userId });

            // Notify first player to act
            const currentPlayer = table.getCurrentPlayer();
            io.in(tableId).emit('playerTurn', { userId: currentPlayer.userId });

            syncTableToAll(table);
        });

        socket.on('bet', ({ tableId, userId, amount }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            const currentPlayer = table.getCurrentPlayer();
            if (!currentPlayer || currentPlayer.userId !== userId) {
                return io.to(socket.id).emit('error', { message: "It's not your turn" });
            }

            const success = table.placeBet(userId, amount);

            io.in(tableId).emit('betPlaced', {
                userId,
                success,
                pot: table.pot,
                currentBet: table.currentBet
            });

            if (success) {
                const nextPlayer = table.getCurrentPlayer();
                io.in(tableId).emit('playerTurn', { userId: nextPlayer.userId });
            }

            syncTableToAll(table);
        });

        socket.on('nextStage', ({ tableId, stage }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            if (stage === 'flop') table.dealFlop();
            else if (stage === 'turn') table.dealTurn();
            else if (stage === 'river') table.dealRiver();

            io.in(tableId).emit('communityCards', table.communityCards);

            // Reset turn to first active player after each stage
            table.currentTurnIndex = 0;
            const currentPlayer = table.getCurrentPlayer();
            io.in(tableId).emit('playerTurn', { userId: currentPlayer.userId });

            syncTableToAll(table);
        });

        socket.on('showdown', ({ tableId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            const result = table.showdown();
            io.in(tableId).emit('winner', result);

            syncTableToAll(table);
        });

        socket.on('exitGame', ({ tableId, userId }) => {
            const success = removePlayerFromTable({ tableId, userId });
            if (!success) io.to(socket.id).emit('error', { message: 'Table does not exist' });
        });

        socket.on('disconnect', () => {
            // Optional: mark player offline or remove them from table
        });
    });
};
