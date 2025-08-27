import DeckService from './deckService.js';

export default class Table {
    constructor() {
        this.players = [];
        this.communityCards = [];
        this.deck = new DeckService();
        this.pot = 0;
        this.currentBet = 0;
        this.rankOrder = "23456789TJQKA";

        // Turn-related
        this.currentTurnIndex = 0; // index in this.players of who's turn it is
        this.isGameStarted = false;

    }

    rankValue = r => this.rankOrder.indexOf(r);


    addPlayer({ socketId, userId, username = 'Anonymous' }) {
        const alreadyJoined = this.players.some(p => p.userId === userId);
        if (!alreadyJoined) {
            this.players.push({
                socketId,
                userId,
                username,
                hand: [],
                chips: 1000,
                currentBet: 0,
                isActive: true
            });
        }
    }
    removePlayer(userId) {
        const index = this.players.findIndex(p => p.userId === userId);
        if (index === -1) return null;

        const [removed] = this.players.splice(index, 1);

        const activePlayers = this.players.filter(p => p.isActive);
        if (activePlayers.length > 0 && removed.chips > 0) {
            const share = Math.floor(removed.chips / activePlayers.length);
            let remainder = removed.chips - share * activePlayers.length;

            activePlayers.forEach(p => p.chips += share);

            for (let i = 0; remainder > 0 && i < activePlayers.length; i++, remainder--) {
                activePlayers[i].chips += 1;
            }
        }

        if (this.currentTurn === removed.userId) {
            if (activePlayers.length > 0) {
                const currentIndex = index % activePlayers.length;
                this.currentTurn = activePlayers[currentIndex].userId;
            } else {
                this.currentTurn = null;
            }
        }

        return removed;
    }

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
            currentBet: this.currentBet,
            totalPlayers: this.players.length
        };
    }

    startGame() {
        this.deck.resetDeck();
        this.players.forEach(p => p.hand = this.deck.deal(2));
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.players.forEach(p => p.isActive = true);
        this.currentTurnIndex = 0;
        this.isGameStarted = true;
    }

    nextTurn() {
        if (!this.isGameStarted) return null;
        const activePlayers = this.players.filter(p => p.isActive && p.chips > 0);
        if (activePlayers.length <= 1) return null;
        let attempts = 0;
        do {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
            attempts++;
            if (attempts > this.players.length) return null;
        } while (!this.players[this.currentTurnIndex].isActive || this.players[this.currentTurnIndex].chips <= 0);
        return this.players[this.currentTurnIndex];
    }

    getCurrentPlayer() {
        return this.players[this.currentTurnIndex];
    }

    dealFlop() {
        this.communityCards.push(...this.deck.deal(3));
    }

    dealTurn() {
        this.communityCards.push(...this.deck.deal(1));
    }

    dealRiver() {
        this.communityCards.push(...this.deck.deal(1));
    }

    placeBet(playerId, amount) {
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.userId !== playerId) return false;
        const player = currentPlayer;
        if (player.chips < amount) return false;
        player.chips -= amount;
        player.currentBet += amount;
        this.pot += amount;
        this.currentBet = Math.max(this.currentBet, amount);
        this.nextTurn();
        return true;
    }

    // -----------------------------------------
    // Poker Hand Evaluation Logic
    // -----------------------------------------
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
            const sf = getStraightFlush(cards, flushSuit);
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

        // Flush
        if (flushSuit) {
            return { rank: 6, name: "Flush", tiebreaker: flushCards.slice(0, 5) };
        }

        // Straight
        if (straightHigh !== null) {
            return { rank: 5, name: "Straight", tiebreaker: [straightHigh] };
        }

        // Three of a Kind
        if (threeVals.length) {
            const three = threeVals[0];
            const kickers = sortedByFreq.filter(v => v !== three).slice(0, 2);
            return { rank: 4, name: "Three of a Kind", tiebreaker: [three, ...kickers] };
        }

        // Two Pair
        if (pairVals.length >= 2) {
            const [highPair, lowPair] = pairVals.slice(0, 2);
            const kicker = sortedByFreq.find(v => v !== highPair && v !== lowPair);
            return { rank: 3, name: "Two Pair", tiebreaker: [highPair, lowPair, kicker] };
        }

        // One Pair
        if (pairVals.length === 1) {
            const pair = pairVals[0];
            const kickers = sortedByFreq.filter(v => v !== pair).slice(0, 3);
            return { rank: 2, name: "One Pair", tiebreaker: [pair, ...kickers] };
        }

        // High Card
        return { rank: 1, name: "High Card", tiebreaker: values.slice(0, 5) };
    }


    // -----------------------------------------
    // Determine Winners (Handles Ties)
    // -----------------------------------------
    showdown() {
        let winners = [];
        let best = null;

        this.players.forEach(player => {
            const allCards = [...player.hand, ...this.communityCards];
            const handResult = this.evaluateHand(allCards);

            if (
                !best ||
                handResult.rank > best.rank ||
                (handResult.rank === best.rank &&
                    this.compareTiebreakers(handResult.tiebreaker, best.tiebreaker) > 0)
            ) {
                best = handResult;
                winners = [{
                    player,
                    handResult: {
                        name: handResult.name,
                        rank: handResult.rank,
                        tiebreaker: handResult.tiebreaker
                    }
                }];
            } else if (
                handResult.rank === best.rank &&
                this.compareTiebreakers(handResult.tiebreaker, best.tiebreaker) === 0
            ) {
                winners.push({
                    player,
                    handResult: {
                        name: handResult.name,
                        rank: handResult.rank,
                        tiebreaker: handResult.tiebreaker
                    }
                });
            }
        });

        // Award pot to winners (split if tie)
        if (winners.length > 0) {
            const share = Math.floor(this.pot / winners.length);
            winners.forEach(w => w.player.chips += share);
        }

        // Reset pot and current bets (but NOT hands/community cards)
        this.pot = 0;
        this.players.forEach(p => p.currentBet = 0);

        // Include detailed info for UI
        return {
            winners,
            communityCards: this.communityCards,
            pot: this.pot
        };
    }

    compareTiebreakers(a, b) {
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if ((a[i] || 0) > (b[i] || 0)) return 1;
            if ((a[i] || 0) < (b[i] || 0)) return -1;
        }
        return 0; // exact tie
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
        if (high !== null) {
            return high === 12
                ? { rank: 10, name: "Royal Flush", tiebreaker: [12] }
                : { rank: 9, name: "Straight Flush", tiebreaker: [high] };
        }
        return null;
    }

}
