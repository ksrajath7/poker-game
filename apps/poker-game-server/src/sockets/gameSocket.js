import tableManager from '../game/tableManager.js';

export default (io) => {
    io.on('connection', (socket) => {

        function syncTableToAll(table) {
            table.players.forEach(player => {
                io.to(player.socketId).emit('tableDetails', table.getDetails(player.userId));
            });
        }

        function addPlayerToTable({ tableId, socketId, userId, username }) {
            const table = tableManager.getTable(tableId);
            if (!table) return false;

            const existingPlayer = table.players.find(p => p.userId === userId);
            if (existingPlayer) {
                existingPlayer.socketId = socketId;
            } else {
                table.addPlayer({ socketId, userId, username });
            }

            socket.join(tableId);
            io.to(socketId).emit('joinedTable', {
                tableId,
                table: table.getDetails(userId)
            });

            socket.to(tableId).emit('playerJoined', {
                userId,
                players: table.getDetails().players
            });

            syncTableToAll(table);
            return true;
        }

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
            if (!table) return io.to(socket.id).emit('error', { message: 'Table not found' });
            io.to(socket.id).emit('tableDetails', table.getDetails(userId));
        });

        socket.on('startGame', ({ tableId, userId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return io.to(socket.id).emit('error', { message: 'Table not found' });

            // ✅ Only table owner can start
            if (table.ownerId !== userId) {
                return io.to(socket.id).emit('error', { message: 'Only the table owner can start the game' });
            }

            // Start the game
            const success = table.startGame(userId); // pass userId to ensure owner check
            if (!success) return io.to(socket.id).emit('error', { message: 'Failed to start the game' });

            // Send private hands to each player
            table.players.forEach(p => {
                io.to(p.socketId).emit('yourHand', { hand: p.hand });
            });

            // Notify everyone the game has started
            io.in(tableId).emit('gameStarted', { startedBy: userId, stage: table.stage });

            // Notify whose turn it is
            const currentPlayer = table.getCurrentPlayer();
            io.in(tableId).emit('playerTurn', { userId: currentPlayer.userId });

            syncTableToAll(table);
        });



        socket.on('bet', ({ tableId, userId, amount, action }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            const currentPlayer = table.getCurrentPlayer();
            if (!currentPlayer || currentPlayer.userId !== userId) {
                return io.to(socket.id).emit('error', { message: "It's not your turn" });
            }

            // amount is only used for raise; call/fold ignores it
            const success = table.placeBet(userId, amount, action);

            io.in(tableId).emit('betPlaced', {
                userId,
                action,
                amount,
                success,
                pot: table.pot,
                currentBet: table.lastBetAmount,
                stage: table.stage
            });

            if (success) {
                if (table.bettingRoundActive && table.playersToAct.length > 0) {
                    const nextPlayer = table.getCurrentPlayer();
                    io.in(tableId).emit('playerTurn', { userId: nextPlayer.userId });
                } else {
                    io.in(tableId).emit('bettingRoundComplete', { stage: table.stage });
                }
            }

            syncTableToAll(table);
        });


        socket.on('nextStage', ({ tableId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            if (table.bettingRoundActive && table.playersToAct.length > 0) {
                return io.to(socket.id).emit('error', { message: 'All players must act before moving to next stage' });
            }

            let stageUpdated = false;

            if (table.stage === 'preflop') stageUpdated = table.dealFlop();
            else if (table.stage === 'flop') stageUpdated = table.dealTurn();
            else if (table.stage === 'turn') stageUpdated = table.dealRiver();
            else {
                return io.to(socket.id).emit('error', { message: 'No further stage available' });
            }

            if (!stageUpdated) {
                return io.to(socket.id).emit('error', { message: 'Cannot deal this stage yet' });
            }

            io.in(tableId).emit('communityCards', { cards: table.communityCards, stage: table.stage });

            // Only start a new betting round if the stage was successfully updated
            table.startBettingRound();
            const currentPlayer = table.getCurrentPlayer();
            io.in(tableId).emit('playerTurn', { userId: currentPlayer.userId });

            syncTableToAll(table);
        });


        socket.on('showdown', ({ tableId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            if (table.stage !== 'river' || (table.bettingRoundActive && table.playersToAct.length > 0)) {
                return io.to(socket.id).emit('error', { message: 'Cannot showdown before all players act on river' });
            }

            const result = table.showdown();
            table.stage = 'showdown';

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
