export default function WinnerPopup({ myUserId, showWinnerPopup, setShowWinnerPopup, winners = [] }) {
    console.log(winners)
    if (showWinnerPopup)
        return (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                <div className="bg-yellow-500 text-black rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center relative">
                    <button
                        onClick={() => setShowWinnerPopup(false)}
                        className="absolute top-4 right-4 text-black hover:text-red-600 text-2xl font-bold"
                    >
                        &times;
                    </button>

                    <h2 className="text-3xl font-extrabold mb-4">🏆 Winner!</h2>

                    {winners.map((winner, idx) => (
                        <div key={idx} className="mb-4">
                            {
                                winner.player?.userId === myUserId ?
                                    <p className="text-xl font-bold">{"You won"}</p>
                                    :
                                    <p className="text-xl font-bold">{winner.player?.username || "Unknown Player"}</p>
                            }
                            <p className="text-lg font-medium">{winner.handResult.name}</p>
                            <p className="text-lg font-semibold">Amout Won: {winner.amountWon}</p>
                        </div>
                    ))}

                    <button
                        onClick={() => setShowWinnerPopup(false)}
                        className="mt-4 bg-black text-yellow-500 px-6 py-2 rounded-xl hover:bg-gray-800 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    return (<></>)
}