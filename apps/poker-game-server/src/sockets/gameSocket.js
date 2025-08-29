import tableManager from '../game/tableManager.js';

export default (io) => {
    io.on('connection', (socket) => {

        function syncTableToAll(table) {
            table.players.forEach(player => {
                io.to(player.socketId).emit('tableDetails', table.getDetails(player.userId));
            });
        }

        socket.on('createTable', ({ userId, username }) => {
            const tableId = Math.floor(100000 + Math.random() * 900000);
            if (tableManager.getTable(tableId)) return io.to(socket.id).emit('tableExists', { tableId });

            tableManager.createTable(tableId, userId);
            const table = tableManager.getTable(tableId);
            table.addPlayer({ socketId: socket.id, userId, username });

            socket.join(tableId);
            io.to(socket.id).emit('tableCreated', { tableId, table: table.getDetails(userId) });
            syncTableToAll(table);
        });

        socket.on('joinTable', ({ tableId, userId, username }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return io.to(socket.id).emit('error', { message: 'Table does not exist' });

            table.addPlayer({ socketId: socket.id, userId, username });
            socket.join(tableId);

            const player = table.players.find(p => p.userId === userId);

            io.in(tableId).emit('playerJoined', { userId, players: table.getDetails().players });
            io.to(socket.id).emit('joinedTable', { tableId, table: table.getDetails(userId) });
            // If they are waiting, explicitly notify them
            if (player.isWaiting) {
                io.to(socket.id).emit('waitingForNextHand', { message: 'You have joined and will enter on the next hand.' });
            }

            syncTableToAll(table);
        });

        socket.on('startGame', ({ tableId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return io.to(socket.id).emit('error', { message: 'Table not found' });

            const activePlayers = table.players.filter(p => !p.isWaiting);
            if (activePlayers.length < 2) {
                return io.to(socket.id).emit('error', { message: 'Not enough active players to start the game.' });
            }

            table.startGame();
            table.players.forEach(p => {
                if (!p.isWaiting) io.to(p.socketId).emit('yourHand', { hand: p.hand });
            });

            io.in(tableId).emit('winner', []);
            io.in(tableId).emit('gameStarted', { stage: table.stage });
            io.in(tableId).emit('playerTurn', { userId: table.getCurrentPlayer()?.userId });
            syncTableToAll(table);
        });

        socket.on('bet', ({ tableId, userId, amount, action }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;
            const success = table.placeBet(userId, amount, action);
            //success will be getting from placeBet,
            if (success === true || success === false) {
                io.in(tableId).emit('betPlaced', {
                    userId,
                    action,
                    amount,
                    success,
                    pot: table.pot,
                    currentBet: table.lastBetAmount,
                    stage: table.stage
                });
                if (table.bettingRoundActive && table.playersToAct.length > 0) {
                    io.in(tableId).emit('playerTurn', { userId: table.getCurrentPlayer()?.userId });
                } else if (!table.bettingRoundActive) {
                    io.in(tableId).emit('bettingRoundComplete', { stage: table.stage });
                }
            }
            //success will be getting from showdown, if any player perform fold, in that case, immediately announce the winner,
            else {
                io.in(tableId).emit('winner', success);
            }
            syncTableToAll(table);
        });

        socket.on('requestChips', ({ tableId, borrowerId, lenderId, amount }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            const result = table.requestChips(borrowerId, lenderId, amount);

            syncTableToAll(table);
        });

        socket.on('donate', ({ tableId, borrowerId, lenderId, amount, interestRate }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            const result = table.donateChips(borrowerId, lenderId, amount, interestRate);

            if (result) {
                io.in(tableId).emit('debtUpdated', {
                    borrowerId,
                    lenderId,
                    success: result.success,
                    message: result.message,
                    debts: table.getDetails(borrowerId).players.find(p => p.userId === borrowerId).debts,
                    borrowerChips: result.borrowerChips,
                    lenderChips: result.lenderChips
                });
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

            table.startBettingRound();
            const currentPlayer = table.getCurrentPlayer();
            io.in(tableId).emit('playerTurn', { userId: currentPlayer.userId });

            syncTableToAll(table);
        });

        socket.on('showdown', ({ tableId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return;

            const result = table.showdown(); // returns winner info
            io.in(tableId).emit('winner', result);

            // Attempt to settle debts for the winner(s)
            result.forEach(winner => {
                const settledDebts = table.settleDebtsAfterWin(winner.userId); // only if full repayment possible
                settledDebts.forEach(d => {
                    io.in(tableId).emit('debtSettled', d); // emit each settled debt
                });
            });

            io.in(tableId).emit('readyForNextHand', { message: 'Hand complete. Start next hand when ready.' });

            syncTableToAll(table);
        });


        socket.on('exitGame', ({ tableId, userId }) => {
            const table = tableManager.getTable(tableId);
            if (!table) return io.to(socket.id).emit('error', { message: 'Table does not exist' });

            const removed = table.removePlayer(userId);
            if (removed) {
                io.in(tableId).emit('playerLeft', { userId, players: table.getDetails().players });
                io.to(removed.socketId).emit('removedFromTable', { tableId, message: 'You have been removed from the table.' });
            }
            syncTableToAll(table);
        });

        socket.on('disconnect', () => {
            // Optional: handle disconnect
        });
    });
};
