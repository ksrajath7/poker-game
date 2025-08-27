import socket from "@/lib/socket";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { _retrieveData } from "@/lib/local-storage";
import PlayingCard from "../App/PlayingCard";

function GamePage() {
    const { joinedTableId } = useParams();
    const navigate = useNavigate();

    const [players, setPlayers] = useState([]);
    const [communityCards, setCommunityCards] = useState([]);
    const [pot, setPot] = useState(0);
    const [currentBet, setCurrentBet] = useState(0);
    const [hand, setHand] = useState([]);
    const [betAmount, setBetAmount] = useState(0);
    const [error, setError] = useState("");
    const [winners, setWinners] = useState([]);
    const [currentTurn, setCurrentTurn] = useState(null); // <-- Track whose turn

    const userId = _retrieveData("userId", "string");
    const username = _retrieveData("username", "string");

    // -------------------------------
    // Join/rejoin table on load
    // -------------------------------
    useEffect(() => {
        if (!joinedTableId || !userId) {
            setError("Missing table or user info");
            return;
        }

        socket.emit("joinTable", { tableId: joinedTableId, userId, username });

        // -------------------------------
        // Socket Events
        // -------------------------------
        socket.on("joinedTable", ({ table }) => {
            setPlayers(table.players);
            setCommunityCards(table.communityCards);
            setPot(table.pot);
            setCurrentBet(table.currentBet);

            const me = table.players.find(p => p.userId === userId);
            setHand(me?.hand || []);
        });

        socket.on("tableDetails", ({ players, communityCards, pot, currentBet }) => {
            setPlayers(players);
            setCommunityCards(communityCards);
            setPot(pot);
            setCurrentBet(currentBet);

            const me = players.find(p => p.userId === userId);
            setHand(me?.hand || []);
        });

        socket.on("yourHand", ({ hand }) => setHand(hand));

        socket.on("playerJoined", ({ players }) => setPlayers(players));
        socket.on("playerLeft", ({ players }) => setPlayers(players));

        socket.on("betPlaced", ({ pot, currentBet }) => {
            setPot(pot);
            setCurrentBet(currentBet);
        });

        socket.on("communityCards", cards => setCommunityCards(cards));

        socket.on("playerTurn", ({ userId }) => setCurrentTurn(userId)); // <-- Update turn

        socket.on("winner", winnerArray => {
            if (winnerArray.winners) setWinners(winnerArray.winners);
            else setWinners([]);
        });

        socket.on("removedFromTable", () => navigate("/"));
        socket.on("error", ({ message }) => setError(message));

        socket.io.on("reconnect", () => {
            socket.emit("joinTable", { tableId: joinedTableId, userId, username });
        });

        // Cleanup
        return () => {
            socket.off("joinedTable");
            socket.off("tableDetails");
            socket.off("yourHand");
            socket.off("playerJoined");
            socket.off("playerLeft");
            socket.off("betPlaced");
            socket.off("communityCards");
            socket.off("playerTurn");
            socket.off("winner");
            socket.off("removedFromTable");
            socket.off("error");
            socket.io.off("reconnect");
        };
    }, [joinedTableId, userId, username, navigate]);

    // -------------------------------
    // Actions
    // -------------------------------
    const handleStartGame = () => socket.emit("startGame", { tableId: joinedTableId, userId });
    const handleBet = () => {
        if (betAmount > 0) {
            socket.emit("bet", { tableId: joinedTableId, userId, amount: betAmount });
            setBetAmount(0);
        }
    };
    const handleNextStage = stage => socket.emit("nextStage", { tableId: joinedTableId, stage });
    const handleShowdown = () => socket.emit("showdown", { tableId: joinedTableId });
    const handleExitGame = () => socket.emit("exitGame", { tableId: joinedTableId, userId });

    // -------------------------------
    // UI
    // -------------------------------
    return (
        <div className="min-h-[100svh] bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
            <main className="w-full max-w-5xl px-4 py-6 space-y-6">

                {/* Error Message */}
                {error && <div className="text-center text-red-400 font-semibold">{error}</div>}

                {/* Table Info */}
                {joinedTableId && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Table: {joinedTableId}</h2>
                        <p className="text-sm text-gray-400">
                            Pot: <span className="text-green-400">${pot}</span> | Current Bet:{" "}
                            <span className="text-yellow-400">${currentBet}</span>
                        </p>
                        {currentTurn && (
                            <p className="text-sm text-indigo-400 mt-1">
                                {currentTurn === userId ? "⏳ Your turn!" : `🎯 ${players.find(p => p.userId === currentTurn)?.username}'s turn`}
                            </p>
                        )}
                    </div>
                )}

                {/* Community Cards */}
                <div className="text-center">
                    <div className="flex justify-center gap-2 flex-wrap">
                        {communityCards.map((c, i) => (
                            <PlayingCard key={i} rank={c.rank} suit={c.suit} />
                        ))}
                    </div>
                </div>

                {/* Player Hand */}
                <div className="text-center">
                    <h4 className="text-sm font-semibold mb-2">Your Hand</h4>
                    <div className="flex justify-center gap-2 flex-wrap">
                        {hand.length ? (
                            hand.map((c, i) => (
                                <PlayingCard key={i} rank={c.rank} suit={c.suit} />
                            ))
                        ) : (
                            <p>Waiting for deal...</p>
                        )}
                    </div>
                </div>

                {/* Players and Winner Display */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    {players.map((p, i) => {
                        const isWinner = winners.some(w => w.player.userId === p.userId);
                        const winnerInfo = winners.find(w => w.player.userId === p.userId);
                        return (
                            <div
                                key={i}
                                className={`p-3 rounded-lg transition bg-gray-800
                    ${currentTurn === p.userId ? "ring-2 ring-yellow-400" : ""} 
                    ${isWinner ? "border-2 border-green-400" : ""}`}
                            >
                                <p className="font-semibold">{p.username}</p>
                                <p className="text-sm text-green-300">Chips: ${p.chips}</p>
                                {isWinner && winnerInfo && (
                                    <p className="text-xs text-green-200 mt-1">
                                        Winner: {winnerInfo.handResult.name} ({winnerInfo.handResult.rank})
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>


                {/* Game Controls */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                    <button
                        onClick={handleStartGame}
                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                    >
                        🎲 Start Game
                    </button>

                    <input
                        type="number"
                        value={betAmount}
                        onChange={e => setBetAmount(parseInt(e.target.value))}
                        placeholder="Bet amount"
                        className="px-3 py-2 rounded text-black bg-white w-32"
                        disabled={currentTurn !== userId} // Disable if not your turn
                    />

                    <button
                        onClick={handleBet}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        disabled={currentTurn !== userId} // Disable if not your turn
                    >
                        💰 Bet
                    </button>

                    <button
                        onClick={() => handleNextStage("flop")}
                        className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition"
                    >
                        🃏 Deal Flop
                    </button>

                    <button
                        onClick={() => handleNextStage("turn")}
                        className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 transition"
                    >
                        🃏 Deal Turn
                    </button>

                    <button
                        onClick={() => handleNextStage("river")}
                        className="px-4 py-2 rounded bg-yellow-700 text-white hover:bg-yellow-800 transition"
                    >
                        🃏 Deal River
                    </button>

                    <button
                        onClick={handleShowdown}
                        className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition"
                    >
                        🏁 Showdown
                    </button>

                    <button
                        onClick={handleExitGame}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                    >
                        🚪 Exit
                    </button>
                </div>
            </main>
        </div>
    );
}

export default GamePage;
