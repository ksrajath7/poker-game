import PlayingCard from "./PlayingCard";

export default function Player({ myUserId, x, y, currentTurn, player, winnerInfo, isWinner, myHand }) {
    console.log(winnerInfo, isWinner)

    return (
        <div
            className="absolute group bg-red-200"
            style={{ transform: `translate(${x}px, ${y}px)` }}
        >
            {/* Cards behind the player info */}
            <div className="">
                {player.hand.length > 0 && (
                    <div
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-[-8px] transition-all duration-300 group-hover:-top-16"
                    >
                        {player.hand.map((c, i) => (
                            <PlayingCard
                                key={i}
                                rank={c !== "Hidden" ? c.rank : undefined}
                                suit={c !== "Hidden" ? c.suit : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Player info block */}
            <div
                className={`scale-105
        relative p-2 px-6 rounded-xl text-center shadow-lg transition-all duration-300 box
        ${currentTurn === player.userId ? "ring-4 ring-yellow-400 border-run" : ""}
        ${isWinner ? "border-4 border-green-400" : ""}
       hover:scale-100
    `}
                style={{ minWidth: "100px", zIndex: 10 }}
            >
                <p className="font-semibold text-white text-sm">{player.username}</p>
                <p className="text-xs text-green-300">Chips: ${player.chips}</p>
                {isWinner && winnerInfo && (
                    <p className="text-xs text-green-200 mt-1">
                        Winner: {winnerInfo.handResult.name}
                    </p>
                )}
            </div>
        </div>


    )
}