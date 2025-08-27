export default function GameControls({ handleStartGame, isGameStarted, currentTurn, userId, betAmount, setBetAmount, handleCall, handleRaise, handleFold, handleNextStage, stage, bettingRoundActive, handleShowdown, currentBet }) {
    return (
        <div className="absolute bottom-6 flex flex-wrap justify-center gap-3 z-10">
            <button disabled={isGameStarted && stage !== "showdown"} onClick={handleStartGame} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition" >
                {/* <span>🎲 Start Game</span> */}
                {isGameStarted ? stage !== "showdown" ? <span>Game in progress</span> : <span>🎲 Re-Start Game</span> : <span>🎲 Start Game</span>}
            </button>

            {currentTurn === userId && isGameStarted && bettingRoundActive && (
                <>
                    <input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value))} placeholder="Raise amount" className="px-3 py-2 rounded text-black bg-white w-32" min={currentBet} />
                    <button onClick={handleCall} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">📞 Call</button>
                    <button onClick={handleRaise} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition">⬆️ Raise</button>
                    <button onClick={handleFold} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition">❌ Fold</button>
                </>
            )}

            {/* Stage-based buttons */}
            {isGameStarted && currentTurn !== userId && ["preflop", "flop", "turn", "river"].includes(stage) && !bettingRoundActive && (
                <button onClick={handleNextStage} className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition">🃏 Deal Next Stage</button>
            )}
            {currentTurn !== userId && stage === "river" && !bettingRoundActive && (
                <button onClick={handleShowdown} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition">🏁 Showdown</button>
            )}

        </div>
    )
}