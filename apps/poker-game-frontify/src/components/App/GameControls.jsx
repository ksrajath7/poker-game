import { useState } from "react";

export default function GameControls({
    tableOwnerId,
    handleStartGame,
    isGameStarted,
    currentTurn,
    userId,
    betAmount,
    setBetAmount,
    handleCall,
    handleRaise,
    handleFold,
    handleNextStage,
    stage,
    bettingRoundActive,
    handleShowdown,
    currentBet,
}) {
    const [showRaiseInput, setShowRaiseInput] = useState(false);
    const isMyTurn = currentTurn === userId;

    const handleRaiseClick = () => setShowRaiseInput(true);
    const handleRaiseConfirm = () => {
        handleRaise();
        setShowRaiseInput(false);
    };
    const handleRaiseCancel = () => setShowRaiseInput(false);
    return (
        <div className="absolute bottom-6 flex flex-col items-center gap-4 z-10 w-full px-4">
            {/* Start / Restart Game */}
            {(tableOwnerId === userId && (!isGameStarted || stage === "showdown")) ? (
                <button
                    onClick={handleStartGame}
                    className="px-6 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition w-64"
                >
                    {isGameStarted ? "🎲 Re-Start Game" : "🎲 Start Game"}
                </button>
            )
                : <></>
            }

            {/* Betting Controls */}
            {isMyTurn && isGameStarted && bettingRoundActive && (
                <div className="flex flex-wrap justify-center gap-3 items-center bg-gray-800/80 p-4 rounded-xl shadow-lg relative">
                    <button
                        onClick={handleCall}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        👍 Call
                    </button>
                    <button
                        onClick={handleRaiseClick}
                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                    >
                        ⬆️ Raise
                    </button>
                    <button
                        onClick={handleFold}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                    >
                        ❌ Fold
                    </button>
                </div>
            )}

            {/* Stage Progression Controls */}
            {(tableOwnerId === userId && isGameStarted) && (
                <div className="flex flex-wrap justify-center gap-3">
                    {["preflop", "flop", "turn"].includes(stage) && !bettingRoundActive && (
                        <button
                            onClick={handleNextStage}
                            className="px-5 py-3 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition shadow-md"
                        >
                            🃏 Deal Next Stage
                        </button>
                    )}
                    {stage === "river" && !bettingRoundActive && (
                        <button
                            onClick={handleShowdown}
                            className="px-5 py-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition shadow-md"
                        >
                            🏁 Showdown
                        </button>
                    )}
                </div>
            )}

            {/* Full-page Raise Modal */}
            {showRaiseInput && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-white text-black rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center relative">
                        <h2 className="text-lg font-semibold mb-4">Enter Raise Amount</h2>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(parseInt(e.target.value))}
                            placeholder={`Min ${currentBet}`}
                            className="px-3 py-2 rounded text-black w-full mb-4 outline-none ring-2 focus:ring-2 focus:ring-green-500"
                            min={currentBet}
                        />
                        <div className="flex justify-center gap-4 mt-3">
                            <button
                                onClick={handleRaiseConfirm}
                                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition w-1/2"
                            >
                                ✅ Confirm
                            </button>
                            <button
                                onClick={handleRaiseCancel}
                                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500 transition w-1/2"
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
