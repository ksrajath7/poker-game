export default class DeckService {
    constructor() {
        this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = [];
        this.resetDeck();
    }

    resetDeck() {
        this.deck = [];
        for (const suit of this.suits) {
            for (const rank of this.ranks) {
                this.deck.push({ suit, rank });
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal(count) {
        return this.deck.splice(0, count);
    }
}
