import PlayingCard from "./PlayingCard";

export default function Player({ myUserId, x, y, chipX, chipY, currentTurn, player, winnerInfo, isWinner, myHand }) {
    const isMe = player.userId === myUserId;

    return (
        <div
            className="absolute group select-none"
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

            {/* {player.totalBet > 0 && (
                <div
                    className="absolute"
                    style={{
                        transform: `translate(${chipX}px, ${chipY}px)`,
                        zIndex: 1,
                    }}
                >
                    <div className="bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg ring-2 ring-white border border-yellow-600 rotate-[5deg] animate-chip">
                        ₵{player.totalBet}
                    </div>
                </div>
            )} */}

            {player.roundTotalBet > 0 && (
                <div
                    className="absolute"
                    style={{
                        transform: `translate(${chipX}px, ${chipY}px)`, // slight offset
                        zIndex: 1,
                    }}
                >
                    <div className="bg-yellow-300 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-md ring-1 ring-white border border-yellow-500 rotate-[-5deg] animate-chip">
                        ₵{player.roundTotalBet}
                    </div>
                </div>
            )}

            {/* Player info block */}
            <div
                className={`scale-105
        relative p-2 px-4 rounded-xl text-center shadow-lg transition-all duration-300 box
        ${currentTurn === player.userId ? "ring-4 ring-yellow-400 border-run" : ""}
        ${isWinner ? "border-4 border-green-400" : ""}
       hover:scale-100 w-[150px]
    `}
                style={{ minWidth: "100px", zIndex: 10 }}
            >
                <p className="font-semibold text-white text-sm">
                    {player.username}

                </p>

                <p className="text-xs text-green-300 mt-1">Chips: ${player.chips}</p>
                {isWinner && winnerInfo && (
                    <p className="text-xs text-green-200 mt-1">
                        Winner: {winnerInfo.handResult.name}
                    </p>
                )}
                {player.isWaiting &&
                    <p className="font-semibold text-white text-sm bg-red-600 rounded-full mt-1">
                        <span className="px-2 py-0.5 text-[10px] ">
                            Waiting for next hand
                        </span>
                    </p>
                }
                {isMe && (
                    <p className="font-semibold text-white text-sm mt-1">
                        <span className="px-2 py-0.5 text-[10px] bg-blue-600 rounded-full">
                            Me
                        </span>
                    </p>
                )}
            </div>
        </div>


    )
}