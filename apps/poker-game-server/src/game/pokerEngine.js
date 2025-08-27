import DeckService from './deckService.js';

export default class Table {
    constructor() {
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
    }

    rankValue = r => this.rankOrder.indexOf(r);

    // ---------------- Player Management ----------------
    addPlayer({ socketId, userId, username = 'Anonymous' }) {
        if (!this.players.some(p => p.userId === userId)) {
            this.players.push({
                socketId,
                userId,
                username,
                hand: [],
                chips: 1000,
                currentBet: 0,
                isActive: true
            });
        } else {
            // Update socketId if already exists
            const existing = this.players.find(p => p.userId === userId);
            existing.socketId = socketId;
        }
    }

    removePlayer(userId) {
        const index = this.players.findIndex(p => p.userId === userId);
        if (index === -1) return null;

        const [removed] = this.players.splice(index, 1);

        // Redistribute chips
        const activePlayers = this.players.filter(p => p.isActive);
        if (activePlayers.length > 0 && removed.chips > 0) {
            const share = Math.floor(removed.chips / activePlayers.length);
            let remainder = removed.chips - share * activePlayers.length;
            activePlayers.forEach(p => p.chips += share);
            for (let i = 0; remainder > 0 && i < activePlayers.length; i++, remainder--) {
                activePlayers[i].chips += 1;
            }
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
                isActive: p.isActive,
                hand: p.userId === forUserId ? p.hand : (p.hand.length ? ['Hidden', 'Hidden'] : []),
            })),
            communityCards: this.communityCards,
            pot: this.pot,
            currentBet: this.lastBetAmount,
            totalPlayers: this.players.length,
            isGameStarted: this.isGameStarted,
            bettingRoundActive: this.bettingRoundActive,
            stage: this.stage
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

        this.players.forEach(p => {
            p.hand = this.deck.deal(2);
            p.currentBet = 0;
            p.isActive = true;
        });

        this.startBettingRound();
    }

    startBettingRound() {
        this.bettingRoundActive = true;
        this.players.forEach(p => p.currentBet = 0);
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
        this.startBettingRound();  // ✅ this resets playersToAct and bettingRoundActive
        return true;
    }

    dealTurn() {
        if (!this.isGameStarted || this.stage !== 'flop' || (this.bettingRoundActive && this.playersToAct.length > 0)) return false;
        this.communityCards.push(...this.deck.deal(1));
        this.stage = 'turn';
        this.startBettingRound();
        return true;
    }

    dealRiver() {
        if (!this.isGameStarted || this.stage !== 'turn' || (this.bettingRoundActive && this.playersToAct.length > 0)) return false;
        this.communityCards.push(...this.deck.deal(1));
        this.stage = 'river';
        this.startBettingRound();
        return true;
    }

    // ---------------- Betting ----------------
    placeBet(playerId, amount = 0, action = "call") {
        if (!this.bettingRoundActive) return false;

        const player = this.players[this.currentTurnIndex];
        if (player.userId !== playerId || !player.isActive || player.chips <= 0) return false;

        switch (action) {
            case "fold":
                player.isActive = false;
                break;
            case "call": {
                const toCall = this.lastBetAmount - player.currentBet;
                const callAmount = Math.min(toCall, player.chips);
                player.chips -= callAmount;
                player.currentBet += callAmount;
                this.pot += callAmount;
                break;
            }
            case "raise": {
                if (amount < this.minimumBet) return false;
                const raiseTotal = (this.lastBetAmount - player.currentBet) + amount;
                if (raiseTotal > player.chips) return false;
                player.chips -= raiseTotal;
                player.currentBet += raiseTotal;
                this.pot += raiseTotal;
                this.lastBetAmount = player.currentBet;

                this.playersToAct = this.players.filter(p => p.isActive && p.userId !== player.userId && p.currentBet < this.lastBetAmount);
                break;
            }
        }

        this.playersToAct = this.playersToAct.filter(p => p.userId !== player.userId);

        if (this.playersToAct.length > 0) {
            this.currentTurnIndex = this.players.findIndex(p => p.userId === this.playersToAct[0].userId);
        } else {
            this.bettingRoundActive = false;
            this.players.forEach(p => p.currentBet = 0);
        }

        return true;
    }

    // ---------------- Showdown ----------------
    showdown() {
        let winners = [];
        let best = null;

        this.players.forEach(player => {
            const allCards = [...player.hand, ...this.communityCards];
            const handResult = this.evaluateHand(allCards);

            if (!best || handResult.rank > best.rank || (handResult.rank === best.rank && this.compareTiebreakers(handResult.tiebreaker, best.tiebreaker) > 0)) {
                best = handResult;
                winners = [{ player, handResult }];
            } else if (handResult.rank === best.rank && this.compareTiebreakers(handResult.tiebreaker, best.tiebreaker) === 0) {
                winners.push({ player, handResult });
            }
        });

        if (winners.length > 0) {
            const share = Math.floor(this.pot / winners.length);
            winners.forEach(w => w.player.chips += share);
        }

        this.pot = 0;
        this.players.forEach(p => p.currentBet = 0);
        this.stage = 'showdown';
        this.bettingRoundActive = false;

        return { winners, communityCards: this.communityCards, pot: this.pot };
    }

    // ---------------- Hand Evaluation Helpers ----------------
    evaluateHand(cards) {
        const values = cards.map(c => this.rankValue(c.rank)).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        const counts = this.countRanks(values);
        const sortedByFreq = this.sortByFrequency(counts);
        const straightHigh = this.getStraightHigh(values);
        const flushSuit = this.getFlushSuit(suits);
        const flushCards = flushSuit ? cards.filter(c => c.suit === flushSuit).map(c => this.rankValue(c.rank)).sort((a, b) => b - a) : [];

        // Straight Flush
        if (flushSuit) {
            const sf = this.getStraightFlush(cards, flushSuit);
            if (sf) return sf;
        }

        // Four of a Kind
        const four = sortedByFreq.find(v => counts[v] === 4);
        if (four !== undefined) {
            const kicker = sortedByFreq.find(v => v !== four);
            return { rank: 8, name: "Four of a Kind", tiebreaker: [four, kicker] };
        }

        // Full House
        const threeVals = sortedByFreq.filter(v => counts[v] === 3);
        const pairVals = sortedByFreq.filter(v => counts[v] === 2);
        if (threeVals.length && (pairVals.length || threeVals.length > 1)) {
            const three = threeVals[0];
            const pair = pairVals[0] || threeVals[1];
            return { rank: 7, name: "Full House", tiebreaker: [three, pair] };
        }

        if (flushSuit) return { rank: 6, name: "Flush", tiebreaker: flushCards.slice(0, 5) };
        if (straightHigh !== null) return { rank: 5, name: "Straight", tiebreaker: [straightHigh] };
        if (threeVals.length) return { rank: 4, name: "Three of a Kind", tiebreaker: [threeVals[0], ...sortedByFreq.filter(v => v !== threeVals[0]).slice(0, 2)] };
        if (pairVals.length >= 2) return { rank: 3, name: "Two Pair", tiebreaker: [pairVals[0], pairVals[1], ...sortedByFreq.filter(v => ![pairVals[0], pairVals[1]].includes(v)).slice(0, 1)] };
        if (pairVals.length === 1) return { rank: 2, name: "One Pair", tiebreaker: [pairVals[0], ...sortedByFreq.filter(v => v !== pairVals[0]).slice(0, 3)] };
        return { rank: 1, name: "High Card", tiebreaker: values.slice(0, 5) };
    }

    compareTiebreakers(a, b) {
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if ((a[i] || 0) > (b[i] || 0)) return 1;
            if ((a[i] || 0) < (b[i] || 0)) return -1;
        }
        return 0;
    }

    countRanks(values) {
        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        return counts;
    }

    sortByFrequency(counts) {
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || b[0] - a[0])
            .map(([v]) => parseInt(v));
    }

    getStraightHigh(values) {
        const unique = [...new Set(values)];
        if (unique.includes(12)) unique.push(-1); // Ace low
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
