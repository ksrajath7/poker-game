import Player from "./Player";
import PlayingCard from "./PlayingCard";

export default function PokerTable({ communityCards, pot, currentBet, currentTurn, userId, players, winners, hand }) {
    // Determine table size based on screen width
    const tableSize = window.innerWidth >= 1024 ? 500 : window.innerWidth >= 768 ? 400 : 300;
    const radius = tableSize / 2 + 50; // spacing outside the table

    // --- Ensure current user is always at bottom ---
    const myIndex = players.findIndex(p => p.userId === userId);
    const rotatedPlayers = myIndex >= 0
        ? [...players.slice(myIndex), ...players.slice(0, myIndex)]
        : players;

    return (
        <div className="relative w-full h-[600px] flex items-center justify-center">
            {/* Table Circle */}
            <div
                className="absolute rounded-full shadow-2xl flex items-center justify-center"
                style={{
                    width: tableSize,
                    height: tableSize,
                    backgroundColor: "#065f46", // Tailwind green-800
                }}
            >
                {/* Community Cards */}
                <div className="flex flex-col items-center gap-4 z-10">
                    <div className="flex justify-center gap-2 flex-wrap mb-4">
                        {communityCards.map((c, i) => (
                            <PlayingCard key={i} rank={c.rank} suit={c.suit} />
                        ))}
                    </div>
                    <div className="flex flex-col gap-1 mt-2 text-xs text-gray-200">
                        <p>
                            Pot: <span className="text-green-400 font-bold">₵{pot}</span> | Current Bet:{" "}
                            <span className="text-yellow-400 font-bold">₵{currentBet}</span>
                        </p>
                        {currentTurn && (
                            <p
                                className={`text-center font-medium ${currentTurn === userId ? "text-indigo-400" : "text-pink-400"
                                    }`}
                            >
                                {currentTurn === userId
                                    ? "⏳ Your turn!"
                                    : `🎯 ${players.find(p => p.userId === currentTurn)?.username}'s turn`}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Players Around Table */}
            {rotatedPlayers.map((p, i) => {
                const isWinner = winners.some(w => w.player.userId === p.userId);
                const winnerInfo = winners.find(w => w.player.userId === p.userId);

                // distribute around circle, with me (index 0) at bottom (90°)
                const angle = (360 / rotatedPlayers.length) * i + 90;
                const x = radius * Math.cos((angle * Math.PI) / 180);
                const y = radius * Math.sin((angle * Math.PI) / 180);

                return (
                    <Player
                        currentBet={currentBet}
                        myUserId={userId}
                        myHand={hand}
                        key={p.userId}
                        x={x}
                        y={y}
                        currentTurn={currentTurn}
                        player={p}
                        isWinner={isWinner}
                        winnerInfo={winnerInfo}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                    />
                );
            })}
        </div>
    );
}
