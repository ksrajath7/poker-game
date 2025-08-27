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
    const [isGameStarted, setIsGameStarted] = useState(false);
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
            setIsGameStarted(table.isGameStarted)

            const me = table.players.find(p => p.userId === userId);
            setHand(me?.hand || []);
        });

        socket.on("tableDetails", ({ players, communityCards, pot, currentBet, isGameStarted }) => {
            setPlayers(players);
            setCommunityCards(communityCards);
            setPot(pot);
            setCurrentBet(currentBet);
            setIsGameStarted(isGameStarted)

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
        <div className="min-h-[100svh] bg-gradient-to-br from-gray-900 to-black text-white relative flex items-center justify-center">
            {/* Top-Right Table Info & Invite */}
            <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-95 p-4 rounded-2xl shadow-2xl w-64 text-center z-50 flex flex-col items-center gap-3">

                {/* Table ID & Copy */}
                <div className="flex items-center justify-center gap-2">
                    <h2 className="text-lg font-extrabold text-yellow-400 truncate">Table: {joinedTableId}</h2>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${joinedTableId}`);

                        }}
                        className="text-gray-300 hover:text-white transition text-lg cursor-pointer"
                        title="Copy Table URL"
                    >
                        📋
                    </button>
                </div>

                {/* Invite Text */}
                <p className="text-gray-300 italic text-xs text-center">
                    Invite your friends to join the game!
                </p>

                {/* Social Share Buttons */}
                <div className="flex justify-center gap-2 w-full">
                    {/* WhatsApp */}
                    <a
                        href={`https://api.whatsapp.com/send?text=Join my poker table! ${window.location.origin}/join/${joinedTableId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition font-semibold shadow-md cursor-pointer text-sm"
                    >
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                            alt="WhatsApp"
                            className="w-5 h-5"
                        />
                        WhatsApp
                    </a>

                    {/* Add more social buttons here if needed */}
                </div>

                {/* Pot & Current Bet */}
                <div className="flex flex-col gap-1 mt-2 text-xs text-gray-200">
                    <p>
                        Pot: <span className="text-green-400 font-bold">${pot}</span> | Current Bet: <span className="text-yellow-400 font-bold">${currentBet}</span>
                    </p>

                    {currentTurn && (
                        <p className={`font-medium ${currentTurn === userId ? 'text-indigo-400' : 'text-pink-400'}`}>
                            {currentTurn === userId ? "⏳ Your turn!" : `🎯 ${players.find(p => p.userId === currentTurn)?.username}'s turn`}
                        </p>
                    )}
                </div>
            </div>


            {/* Community Cards */}
            <div className="flex flex-col items-center gap-4 z-10">
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                    {communityCards.map((c, i) => (
                        <PlayingCard key={i} rank={c.rank} suit={c.suit} />
                    ))}
                </div>

                {/* Player Hand */}
                <div className="text-center mb-4">
                    <h4 className="text-sm font-semibold mb-2">Your Hand</h4>
                    <div className="flex justify-center gap-2 flex-wrap">
                        {hand.length ? hand.map((c, i) => (
                            <PlayingCard key={i} rank={c.rank} suit={c.suit} />
                        )) : <p>Waiting for deal...</p>}
                    </div>
                </div>
            </div>

            {/* Players Around Table */}
            <div className="absolute inset-0 flex items-center justify-center">
                {players.map((p, i) => {
                    const isWinner = winners.some(w => w.player.userId === p.userId);
                    const winnerInfo = winners.find(w => w.player.userId === p.userId);

                    const angle = (360 / players.length) * i;
                    const radius = 250; // distance from center
                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);

                    return (
                        <div
                            key={i}
                            className={`absolute p-3 rounded-lg bg-gray-800 transition
                        ${currentTurn === p.userId ? "ring-2 ring-yellow-400" : ""}
                        ${isWinner ? "border-2 border-green-400" : ""}`}
                            style={{
                                transform: `translate(${x}px, ${y}px)`,
                                textAlign: "center",
                                minWidth: "90px"
                            }}
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
            <div className="absolute bottom-6 flex flex-wrap justify-center gap-3 z-10">
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
                    disabled={currentTurn !== userId}
                />

                <button
                    onClick={handleBet}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                    disabled={currentTurn !== userId}
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
        </div>

    );
}

export default GamePage;
