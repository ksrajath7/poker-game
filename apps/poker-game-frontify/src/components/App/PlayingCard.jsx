import { useState, useEffect } from 'react';
import heart from '../../assets/heart.png';
import club from '../../assets/club.png';
import diamond from '../../assets/diamond.png';
import spade from '../../assets/spade.png';
import card_back from '../../assets/card-back.png';

export default function PlayingCard({ rank, suit }) {
    const [flipped, setFlipped] = useState(false);

    const suitImage =
        suit === 'Hearts'
            ? heart
            : suit === 'Diamonds'
                ? diamond
                : suit === 'Clubs'
                    ? club
                    : spade;

    const textColor =
        suit === 'Hearts' || suit === 'Diamonds' ? 'text-red-600' : 'text-black';

    useEffect(() => {
        // Only flip if both rank and suit are defined
        if (rank && suit) {
            const timer = setTimeout(() => setFlipped(true), 100); // small delay for animation
            return () => clearTimeout(timer);
        } else {
            setFlipped(false); // show back if undefined
        }
    }, [rank, suit]);

    return (
        <div className="w-14 h-20 select-none perspective-1000">
            <div
                className={`relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
            >
                {/* Card Back */}
                <img
                    src={card_back}
                    alt="Card back"
                    className="absolute w-full h-full rounded shadow-md [backface-visibility:hidden]"
                />

                {/* Card Front */}
                {rank && suit && (
                    <div className="absolute w-full h-full rounded bg-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)] p-0.5">
                        <div className="relative w-full h-full rounded flex flex-col justify-between">
                            {/* Top-left corner */}
                            <div className="absolute top-0 left-0 flex flex-col items-center text-xs">
                                <div className={`${textColor} font-bold`}>{rank}</div>
                                <img src={suitImage} alt={`${suit} symbol`} className="w-3 h-3" />
                            </div>

                            {/* Bottom-right corner */}
                            <div className="absolute bottom-0 right-0 flex flex-col items-center text-xs rotate-180">
                                <div className={`${textColor} font-bold`}>{rank}</div>
                                <img src={suitImage} alt={`${suit} symbol`} className="w-3 h-3" />
                            </div>

                            {/* Center symbol */}
                            <div className="flex items-center justify-center h-full">
                                <img src={suitImage} alt={`${suit} symbol`} className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
