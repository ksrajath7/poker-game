import DeckService from './deckService.js';

export default class PokerEngine {
    constructor(ownerId) {
        this.ownerId = ownerId;
        this.players = [];
        this.communityCards = [];
        this.deck = new DeckService();
        this.pot = 0;
        this.lastBetAmount = 0;
        this.rankOrder = "23456789TJQKA";

        this.currentTurnIndex = 0;
        this.isGameStarted = false;
        this.stage = 'preflop';

        this.minimumBet = 10;
        this.bettingRoundActive = false;
        this.playersToAct = [];

        this.currentHandHistory = []; // bets/actions for the ongoing hand
        this.allHandHistories = [];   // stores completed hand histories

        this.isAllInMode = false; // NEW: track global all-in state
    }

    rankValue = r => {
        if (typeof r === 'number') return r; // already numeric index
        if (!r && r !== 0) return -1;
        const s = String(r).toUpperCase();
        const normalized = (s === '10') ? 'T' : s; // accept "10" & "T"
        return this.rankOrder.indexOf(normalized);
    };


    // ---------------- Player Management ----------------
    addPlayer({ socketId, userId, username = 'Anonymous' }) {
        if (!this.players.some(p => p.userId === userId)) {
            // Inside addPlayer
            this.players.push({
                socketId,
                userId,
                username,
                hand: [],
                chips: 1000,
                currentBet: 0,
                roundTotalBet: 0,
                totalBet: 0,
                isActive: !this.isGameStarted,
                isWaiting: this.isGameStarted,
                isAllIn: false,
                debts: [], // NEW: array of { lenderId, amount, interestRate, settled }
                pendingChipRequests: []
            });
        } else {
            const existing = this.players.find(p => p.userId === userId);
            existing.socketId = socketId;
        }
    }
    removePlayer(userId) {
        const index = this.players.findIndex(p => p.userId === userId);
        if (index === -1) return null;

        const [removed] = this.players.splice(index, 1);

        // Redistribute chips if the player was active (not waiting)
        if (!removed.isWaiting) {
            const activePlayers = this.players.filter(p => p.isActive);
            if (activePlayers.length > 0 && removed.chips > 0) {
                const share = Math.floor(removed.chips / activePlayers.length);
                let remainder = removed.chips - share * activePlayers.length;
                activePlayers.forEach(p => p.chips += share);
                for (let i = 0; remainder > 0 && i < activePlayers.length; i++, remainder--) {
                    activePlayers[i].chips += 1;
                }
            }
        }

        // Reassign owner if the removed player was the owner
        if (removed.userId === this.ownerId) {
            const nextOwner = this.players.find(p => p.isActive);
            this.ownerId = nextOwner ? nextOwner.userId : null;
        }

        return removed;
    }

    getCurrentPlayer() {
        return this.players[this.currentTurnIndex];
    }

    // ---------------- Table Details ----------------
    getDetails(forUserId) {
        return {
            players: this.players.map(p => ({
                userId: p.userId,
                username: p.username,
                chips: p.chips,
                currentBet: p.currentBet,
                roundTotalBet: p.roundTotalBet,
                totalBet: p.totalBet,
                isActive: p.isActive,
                isWaiting: p.isWaiting,
                hand: (p.userId === forUserId || this.stage === 'showdown')
                    ? p.hand
                    : (p.hand.length ? ['Hidden', 'Hidden'] : []),
                debts: p.debts,
                pendingChipRequests: p.pendingChipRequests
            })),
            ownerId: this.ownerId,
            communityCards: this.communityCards,
            pot: this.pot,
            currentBet: this.lastBetAmount,
            totalPlayers: this.players.length,
            isGameStarted: this.isGameStarted,
            bettingRoundActive: this.bettingRoundActive,
            stage: this.stage,
            isAllInMode: this.isAllInMode, // NEW
            betHistory: [],
            currentPlayer: this.currentTurnIndex !== -1 ? this.players[this.currentTurnIndex] || null : null
        };
    }

    // ---------------- Game Flow ----------------
    startGame() {
        this.deck.resetDeck();
        this.communityCards = [];
        this.pot = 0;
        this.lastBetAmount = this.minimumBet;
        this.currentTurnIndex = 0;
        this.stage = 'preflop';
        this.isGameStarted = true;
        this.bettingRoundActive = false;

        this.isAllInMode = false; // reset


        this.players.forEach(p => {
            p.hand = this.deck.deal(2);
            p.currentBet = 0;
            p.isActive = true;
            p.isWaiting = false;
        });

        this.startBettingRound();
    }

    startBettingRound() {
        if (this.isAllInMode) {
            this.bettingRoundActive = false;
            return;
        }
        this.bettingRoundActive = true;
        this.players.forEach(p => p.currentBet = 0);
        this.players.forEach(p => p.roundTotalBet = 0); // reset for new round
        this.playersToAct = this.players.filter(p => p.isActive && p.chips > 0);
        if (this.playersToAct.length > 0) {
            this.currentTurnIndex = this.players.findIndex(p => p.userId === this.playersToAct[0].userId);
        }
    }

    nextTurn() {
        if (!this.bettingRoundActive || this.playersToAct.length === 0) return null;
        const nextPlayer = this.playersToAct.shift();
        this.currentTurnIndex = this.players.findIndex(p => p.userId === nextPlayer.userId);
        return nextPlayer;
    }

    // ---------------- Dealing ----------------
    dealFlop() {
        if (!this.isGameStarted) return false;
        if (this.stage !== 'preflop') return false;
        if (this.bettingRoundActive && this.playersToAct.length > 0) return false;

        this.communityCards.push(...this.deck.deal(3));
        this.stage = 'flop';
        if (!this.isAllInMode) this.startBettingRound();
        return true;
    }

    dealTurn() {
        if (!this.isGameStarted) return false;
        if (this.stage !== 'flop' || (this.bettingRoundActive && this.playersToAct.length > 0)) return false;
        this.communityCards.push(...this.deck.deal(1));
        this.stage = 'turn';
        if (!this.isAllInMode) this.startBettingRound();
        return true;
    }

    dealRiver() {
        if (!this.isGameStarted) return false;
        if (this.stage !== 'turn' || (this.bettingRoundActive && this.playersToAct.length > 0)) return false;
        this.communityCards.push(...this.deck.deal(1));
        this.stage = 'river';
        if (!this.isAllInMode) this.startBettingRound();
        return true;
    }

    // Request chips from another player
    requestChips(borrowerId, lenderId, amount) {
        const borrower = this.players.find(p => p.userId === borrowerId);
        const lender = this.players.find(p => p.userId === lenderId);

        if (!borrower || !lender) return { success: false, message: "Player not found" };
        if (lender.chips < amount) return { success: false, message: "Lender does not have enough chips" };

        const existingIndex = lender.pendingChipRequests.findIndex(req => req.borrowerId === borrowerId);
        const newRequest = {
            borrowerName: borrower.username,
            borrowerId,
            amount,
            timestamp: Date.now(),
            status: "pending"
        };

        if (existingIndex !== -1) {
            // Replace the existing request
            lender.pendingChipRequests[existingIndex] = newRequest;
        } else {
            // Add a new request
            lender.pendingChipRequests.push(newRequest);
        }

        return true;
    }
    // Donate chips to another player
    donateChips(borrowerId, lenderId, amount, interestRate = 0.1) {
        if (this.isGameStarted) return false;
        const borrower = this.players.find(p => p.userId === borrowerId);
        const lender = this.players.find(p => p.userId === lenderId);

        if (!borrower || !lender) return { success: false, message: "Player not found" };
        if (lender.chips < amount) return { success: false, message: "Lender does not have enough chips" };

        // Transfer chips immediately
        lender.chips -= amount;
        borrower.chips += amount;

        // Record debt
        borrower.debts.push({ lenderId, amount, interestRate, settled: false });

        return { success: true, borrowerChips: borrower.chips, lenderChips: lender.chips, debt: borrower.debts };
    }

    // Settle debts after a win
    settleDebtsAfterWin(playerId) {
        const winner = this.players.find(p => p.userId === playerId);
        if (!winner || !winner.debts) return [];

        const settledDebts = [];

        winner.debts.forEach(debt => {
            if (!debt.settled) {
                const lender = this.players.find(p => p.userId === debt.lenderId);
                if (!lender) return;

                const totalOwed = Math.ceil(debt.amount * (1 + debt.interestRate));

                // Only settle if winner has enough chips
                if (winner.chips >= totalOwed) {
                    winner.chips -= totalOwed;
                    lender.chips += totalOwed;
                    debt.settled = true;

                    settledDebts.push({
                        lenderId: debt.lenderId,
                        borrowerId: winner.userId,
                        amountOwed: totalOwed,
                        interestRate: debt.interestRate,
                        paidAmount: totalOwed
                    });
                }
            }
        });

        return settledDebts; // could be empty if winner can't pay
    }


    // ---------------- Betting ----------------
    placeBet(playerId, amount = 0, action = "call") {
        if (!this.bettingRoundActive) return false;

        const player = this.players[this.currentTurnIndex];
        if (player.userId !== playerId || !player.isActive || player.chips <= 0) return false;

        let betAmount = 0;

        switch (action) {
            case "fold":
                player.isActive = false;
                break;

            case "call": {
                const toCall = this.lastBetAmount - player.currentBet;
                betAmount = Math.min(toCall, player.chips);
                player.chips -= betAmount;
                player.currentBet += betAmount;
                player.roundTotalBet += betAmount;  // track round
                player.totalBet += betAmount;       // track hand
                this.pot += betAmount;

                if (player.chips === 0) player.isAllIn = true;
                break;
            }

            case "raise": {
                if (amount < this.minimumBet) return false;
                const raiseTotal = (this.lastBetAmount - player.currentBet) + amount;
                if (raiseTotal > player.chips) return false;

                betAmount = raiseTotal;
                player.chips -= betAmount;
                player.currentBet += betAmount;
                player.roundTotalBet += betAmount;
                player.totalBet += betAmount;
                this.pot += betAmount;

                this.lastBetAmount = player.currentBet;

                // reset playersToAct
                this.playersToAct = this.players.filter(
                    p => p.isActive && p.userId !== player.userId && p.currentBet < this.lastBetAmount
                );
                break;
            }
        }

        // remove current player from playersToAct
        this.playersToAct = this.playersToAct.filter(p => p.userId !== player.userId);

        // auto-fold detection
        const activePlayers = this.players.filter(p => p.isActive);
        if (activePlayers.length === 1) {
            return this.showdown();
        }

        // check if all betting done due to all-in
        if (this.players.filter(p => p.isActive && !p.isAllIn).length <= 1) {
            this.isAllInMode = true;
            this.bettingRoundActive = false;
        }

        if (this.playersToAct.length > 0 && !this.isAllInMode) {
            this.currentTurnIndex = this.players.findIndex(p => p.userId === this.playersToAct[0].userId);
        } else {
            this.bettingRoundActive = false;
            this.players.forEach(p => p.currentBet = 0);
            // ⚡ roundTotalBet remains visible for UI until startBettingRound()
        }

        return true;
    }


    // ---------------- Showdown ----------------
    showdown() {
        const activePlayers = this.players.filter(p => p.isActive);
        let potAmount = this.pot;
        let winners = [];

        // If only one active player, they win the whole pot
        if (activePlayers.length === 1) {
            const allCards = [...activePlayers[0].hand, ...this.communityCards];
            const handResult = this.evaluateHand(allCards);

            activePlayers[0].chips += potAmount;

            // NEW: Settle any debts for the winner
            this.settleDebtsAfterWin(activePlayers[0].userId);

            const result = {
                winners: [{ player: activePlayers[0], handResult, amountWon: potAmount }],
                communityCards: this.communityCards,
                pot: potAmount
            };

            // Reset table state but keep waiting players flagged
            this.resetAfterHand();

            return result;
        }

        // Multiple active players: evaluate best hands
        let bestHand = null;

        activePlayers.forEach(player => {
            const allCards = [...player.hand, ...this.communityCards];
            const handResult = this.evaluateHand(allCards);

            if (
                !bestHand ||
                handResult.rank > bestHand.rank ||
                (handResult.rank === bestHand.rank &&
                    this.compareTiebreakers(handResult.tiebreaker, bestHand.tiebreaker) > 0)
            ) {
                bestHand = handResult;
                winners = [{ player, handResult }];
            } else if (
                handResult.rank === bestHand.rank &&
                this.compareTiebreakers(handResult.tiebreaker, bestHand.tiebreaker) === 0
            ) {
                winners.push({ player, handResult });
            }
        });

        // Split pot equally among winners and track amount
        let share = winners.length > 0 ? Math.floor(potAmount / winners.length) : 0;
        winners.forEach(w => {
            w.player.chips += share;
            w.amountWon = share;

            // NEW: Settle debts for each winner
            this.settleDebtsAfterWin(w.player.userId);
        });

        // Reset table state but keep waiting players flagged
        this.resetAfterHand();

        return { winners, communityCards: this.communityCards, pot: potAmount };
    }

    resetAfterHand() {
        this.pot = 0;
        this.players.forEach(p => {
            p.currentBet = 0;
            p.roundTotalBet = 0;
            p.totalBet = 0;
            if (!p.isWaiting) {
                p.isActive = true;
                p.isAllIn = false;
            }
        });
        this.stage = 'showdown';
        this.bettingRoundActive = false;
        this.isGameStarted = false;
        this.isAllInMode = false;
    }

    // ---------------- Hand Evaluation Helpers ----------------
    evaluateHand(cards) {
        const combinations = this.get5CardCombinations(cards);
        let best = { rank: 0, name: "High Card", tiebreaker: [] };

        combinations.forEach(combo => {
            const hand = this.evaluate5CardHand(combo);
            if (
                hand.rank > best.rank ||
                (hand.rank === best.rank && this.compareTiebreakers(hand.tiebreaker, best.tiebreaker) > 0)
            ) {
                best = hand;
            }
        });

        return best;
    }

    // Deterministic 5-card evaluator returning {rank, name, tiebreaker}
    // rank: 9 StraighFlush, 8 Four, 7 FullHouse, 6 Flush, 5 Straight, 4 Trips, 3 TwoPair, 2 Pair, 1 HighCard
    evaluate5CardHand(cards) {
        // cards: array of 5 card objects { rank, suit }
        // map to numeric values (0..12) where 12 = Ace
        const values = cards.map(c => this.rankValue(c.rank)).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);

        // build counts map value -> count
        const counts = this.countRanks(values); // keys are numbers (as strings) but handled below

        // helper lists (numeric)
        const distinctValues = Object.keys(counts).map(k => parseInt(k, 10)).sort((a, b) => b - a);
        const freqToValues = {}; // count -> array of values
        Object.entries(counts).forEach(([val, cnt]) => {
            if (!freqToValues[cnt]) freqToValues[cnt] = [];
            freqToValues[cnt].push(parseInt(val, 10));
        });
        Object.values(freqToValues).forEach(arr => arr.sort((a, b) => b - a)); // sort each freq group descending

        const isFlush = new Set(suits).size === 1;
        const straightHigh = this.getStraightHigh(values); // returns highest value index or null

        // Straight Flush (including Royal)
        if (isFlush && straightHigh !== null) {
            return { rank: 9, name: "Straight Flush", tiebreaker: [straightHigh] };
        }

        // Four of a Kind
        if (freqToValues[4] && freqToValues[4].length > 0) {
            const four = freqToValues[4][0];
            const kicker = distinctValues.find(v => v !== four);
            return { rank: 8, name: "Four of a Kind", tiebreaker: [four, kicker] };
        }

        // Full House (three + pair OR two threes -> use highest three as three, next as pair)
        if ((freqToValues[3] && freqToValues[3].length > 0) && ((freqToValues[2] && freqToValues[2].length > 0) || (freqToValues[3] && freqToValues[3].length > 1))) {
            const three = freqToValues[3][0];
            // pair could be a dedicated pair or the second three (in case of two triplets)
            const pair = (freqToValues[2] && freqToValues[2].length > 0)
                ? freqToValues[2][0]
                : freqToValues[3][1];
            return { rank: 7, name: "Full House", tiebreaker: [three, pair] };
        }

        // Flush
        if (isFlush) {
            // tiebreaker is values sorted desc (already values)
            return { rank: 6, name: "Flush", tiebreaker: values };
        }

        // Straight
        if (straightHigh !== null) {
            return { rank: 5, name: "Straight", tiebreaker: [straightHigh] };
        }

        // Three of a Kind
        if (freqToValues[3] && freqToValues[3].length > 0) {
            const three = freqToValues[3][0];
            // kickers: highest remaining values (distinct order preserved by values array)
            const kickers = values.filter(v => v !== three).slice(0, 2);
            return { rank: 4, name: "Three of a Kind", tiebreaker: [three, ...kickers] };
        }

        // Two Pair
        if (freqToValues[2] && freqToValues[2].length >= 2) {
            const highPair = freqToValues[2][0];
            const lowPair = freqToValues[2][1];
            const kicker = distinctValues.find(v => v !== highPair && v !== lowPair);
            return { rank: 3, name: "Two Pair", tiebreaker: [highPair, lowPair, kicker] };
        }

        // One Pair
        if (freqToValues[2] && freqToValues[2].length === 1) {
            const pair = freqToValues[2][0];
            const kickers = values.filter(v => v !== pair).slice(0, 3);
            return { rank: 2, name: "One Pair", tiebreaker: [pair, ...kickers] };
        }

        // High Card
        return { rank: 1, name: "High Card", tiebreaker: values };
    }

    // Generate all 5-card combinations from cards array (unchanged logic)
    get5CardCombinations(cards) {
        const results = [];
        const choose = (arr, m, start = 0, chosen = []) => {
            if (chosen.length === m) {
                results.push([...chosen]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                chosen.push(arr[i]);
                choose(arr, m, i + 1, chosen);
                chosen.pop();
            }
        };
        choose(cards, 5);
        return results;
    }

    // Compare tiebreaker arrays: return 1 if a>b, -1 if a<b, 0 if equal
    compareTiebreakers(a, b) {
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const av = (a[i] !== undefined) ? a[i] : -1;
            const bv = (b[i] !== undefined) ? b[i] : -1;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }
        return 0;
    }

    // countRanks: accepts numeric values array, returns map value->count (keys kept as numbers via object)
    countRanks(values) {
        const counts = {};
        values.forEach(v => {
            const k = String(v);
            counts[k] = (counts[k] || 0) + 1;
        });
        return counts;
    }

    sortByFrequency(counts) {
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || b[0] - a[0])
            .map(([v]) => parseInt(v));
    }


    // getStraightHigh: unchanged but robust for ace-low; expects numeric value array sorted desc
    getStraightHigh(values) {
        const unique = [...new Set(values)];
        // Ace-low handling: if Ace (12) exists, append -1 so sequence detection finds 3..0..-1 slice
        if (unique.includes(12)) unique.push(-1);
        unique.sort((a, b) => b - a);
        for (let i = 0; i <= unique.length - 5; i++) {
            const seq = unique.slice(i, i + 5);
            if (seq[0] - seq[4] === 4) return seq[0];
        }
        return null;
    }

    getFlushSuit(suits) {
        const suitCount = suits.reduce((acc, s) => ((acc[s] = (acc[s] || 0) + 1), acc), {});
        return Object.keys(suitCount).find(s => suitCount[s] >= 5);
    }

    getStraightFlush(cards, flushSuit) {
        const flushCards = cards.filter(c => c.suit === flushSuit).map(c => this.rankValue(c.rank));
        const high = this.getStraightHigh(flushCards);
        if (high !== null) return high === 12 ? { rank: 10, name: "Royal Flush", tiebreaker: [12] } : { rank: 9, name: "Straight Flush", tiebreaker: [high] };
        return null;
    }
}
