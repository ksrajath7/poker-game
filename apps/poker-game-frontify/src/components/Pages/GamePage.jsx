import socket from "@/lib/socket";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { _retrieveData } from "@/lib/local-storage";
import PlayingCard from "../App/PlayingCard";

function GamePage() {
    const { joinedTableId } = useParams();
    const navigate = useNavigate();

    const [isTableInfoOpen, setIsTableInfoOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const [players, setPlayers] = useState([]);
    const [communityCards, setCommunityCards] = useState([]);
    const [pot, setPot] = useState(0);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [currentBet, setCurrentBet] = useState(10);
    const [hand, setHand] = useState([]);
    const [betAmount, setBetAmount] = useState(0);
    const [error, setError] = useState("");
    const [winners, setWinners] = useState([]);
    const [currentTurn, setCurrentTurn] = useState(null);
    const [stage, setStage] = useState("preflop");
    const [bettingRoundActive, setBettingRoundActive] = useState(false);

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

        socket.on("joinedTable", ({ table }) => {
            setPlayers(table.players);
            setCommunityCards(table.communityCards);
            setPot(table.pot);
            setCurrentBet(table.currentBet || 10);
            setIsGameStarted(table.isGameStarted);
            setStage(table.stage || "preflop");
            setBettingRoundActive(table.bettingRoundActive || false);

            const me = table.players.find(p => p.userId === userId);
            setHand(me?.hand || []);
        });

        socket.on("tableDetails", ({ players, communityCards, pot, currentBet, isGameStarted, stage, bettingRoundActive }) => {
            setPlayers(players);
            setCommunityCards(communityCards);
            setPot(pot);
            setCurrentBet(currentBet || 10);
            setIsGameStarted(isGameStarted);
            setStage(stage || "preflop");
            setBettingRoundActive(bettingRoundActive || false);

            const me = players.find(p => p.userId === userId);
            setHand(me?.hand || []);
        });

        socket.on("yourHand", ({ hand }) => setHand(hand));
        socket.on("playerJoined", ({ players }) => setPlayers(players));
        socket.on("playerLeft", ({ players }) => setPlayers(players));
        socket.on("betPlaced", ({ pot, currentBet, bettingRoundActive }) => {
            setPot(pot);
            setCurrentBet(currentBet);
            setBettingRoundActive(bettingRoundActive);
        });
        socket.on("communityCards", ({ cards, stage }) => {
            setCommunityCards(cards);
            setStage(stage);
        });
        socket.on("playerTurn", ({ userId }) => setCurrentTurn(userId));
        socket.on("bettingRoundComplete", () => setBettingRoundActive(false));
        socket.on("winner", winnerArray => {
            if (winnerArray.winners) setWinners(winnerArray.winners);
            else setWinners([]);
            setStage("showdown");
        });

        socket.on("removedFromTable", () => navigate("/"));
        socket.on("error", ({ message }) => setError(message));

        socket.io.on("reconnect", () => {
            socket.emit("joinTable", { tableId: joinedTableId, userId, username });
        });

        return () => {
            socket.off("joinedTable");
            socket.off("tableDetails");
            socket.off("yourHand");
            socket.off("playerJoined");
            socket.off("playerLeft");
            socket.off("betPlaced");
            socket.off("communityCards");
            socket.off("playerTurn");
            socket.off("bettingRoundComplete");
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
    const handleCall = () => socket.emit("bet", { tableId: joinedTableId, userId, amount: currentBet, action: "call" });
    const handleRaise = () => {
        if (betAmount >= currentBet) {
            socket.emit("bet", { tableId: joinedTableId, userId, amount: betAmount, action: "raise" });
            setBetAmount(0);
        } else alert(`Raise must be at least ${currentBet}`);
    };
    const handleFold = () => socket.emit("bet", { tableId: joinedTableId, userId, action: "fold" });
    const handleNextStage = () => socket.emit("nextStage", { tableId: joinedTableId });
    const handleShowdown = () => socket.emit("showdown", { tableId: joinedTableId });
    const handleExitGame = () => socket.emit("exitGame", { tableId: joinedTableId, userId });
    const handleCopy = (e) => {
        e.stopPropagation(); // Prevent toggling the panel
        navigator.clipboard.writeText(`${window.location.origin}/join/${joinedTableId}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000); // Show "Copied!" for 3 seconds
    };

    // -------------------------------
    // UI
    // -------------------------------
    return (
        <div className="min-h-[100svh] overflow-auto bg-gradient-to-br from-gray-900 to-black text-white relative flex items-center justify-center">




            {/* Top-Left Table Info & Invite */}
            <div className="absolute top-4 left-4 z-50 w-64">
                {/* Header / Toggle Button */}
                <div
                    className="bg-gray-800 bg-opacity-95 p-3 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer"
                    onClick={() => setIsTableInfoOpen(!isTableInfoOpen)}
                >
                    <div className="flex items-center justify-center gap-2">
                        <h2 className="text-lg font-extrabold text-yellow-400 truncate">Table: {joinedTableId}</h2>
                        <button
                            onClick={handleCopy}
                            className="text-gray-300 hover:text-white transition text-xs cursor-pointer"
                            title="Copy Table URL"
                        >
                            {isCopied ? "Copied!" : "Copy link"}
                        </button>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" />

                    {/* <span className="text-gray-300">{isTableInfoOpen ? "🡩" : "🡫"}</span> */}
                </div>

                {/* Collapsible Content */}
                {isTableInfoOpen && (
                    <div className="bg-gray-900 bg-opacity-95 p-4 rounded-2xl shadow-2xl mt-2 flex flex-col items-center gap-3">


                        <p className="text-gray-300 italic text-xs text-center">Invite your friends to join the game!</p>

                        <div className="flex justify-center gap-2 w-full">
                            <a
                                href={`https://api.whatsapp.com/send?text=Join my poker table! ${window.location.origin}/join/${joinedTableId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition font-semibold shadow-md cursor-pointer text-sm"
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" /> WhatsApp
                            </a>
                        </div>


                    </div>
                )}
            </div>

            <button onClick={handleExitGame} className="absolute top-4 right-4 z-50 px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 transition">🚪 Exit</button>



            {/* Poker Table */}
            <div className="relative w-full h-[600px] flex items-center justify-center">
                {/* Table Circle */}
                <div className="absolute w-[500px] h-[500px] bg-green-800 rounded-full shadow-2xl flex items-center justify-center">
                    {/* Community Cards */}
                    <div className="flex flex-col items-center gap-4 z-10">
                        <div className="flex justify-center gap-2 flex-wrap mb-4">
                            {communityCards.map((c, i) => <PlayingCard key={i} rank={c.rank} suit={c.suit} />)}
                        </div>
                        <div className="flex flex-col gap-1 mt-2 text-xs text-gray-200">
                            <p>
                                Pot: <span className="text-green-400 font-bold">${pot}</span> | Current Bet: <span className="text-yellow-400 font-bold">${currentBet}</span>
                            </p>
                            {currentTurn && (
                                <p className={`text-center font-medium ${currentTurn === userId ? 'text-indigo-400' : 'text-pink-400'}`}>
                                    {currentTurn === userId ? "⏳ Your turn!" : `🎯 ${players.find(p => p.userId === currentTurn)?.username}'s turn`}
                                </p>
                            )}
                        </div>
                        <div className="text-center mb-4">
                            <h4 className="text-sm font-semibold mb-2">Your Hand</h4>
                            <div className="flex justify-center gap-2 flex-wrap">
                                {hand.length ? hand.map((c, i) => <PlayingCard key={i} rank={c.rank} suit={c.suit} />) : <p>Waiting for deal...</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Players Around Table */}
                {players.map((p, i) => {
                    const isWinner = winners.some(w => w.player.userId === p.userId);
                    const winnerInfo = winners.find(w => w.player.userId === p.userId);

                    const angle = (360 / players.length) * i;
                    const radius = 220; // radius smaller than table for spacing
                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);

                    return (
                        <div key={i} className="absolute" style={{ transform: `translate(${x}px, ${y}px)` }}>
                            <div className={`
                    p-3 rounded-xl bg-gray-900 bg-opacity-90 text-center shadow-lg transition-all duration-300
                    ${currentTurn === p.userId ? "ring-4 ring-yellow-400 box a" : ""}
                    ${isWinner ? "border-4 border-green-400" : ""}
                    hover:scale-110
                `} style={{ minWidth: "100px" }}>
                                <p className="font-semibold text-white">{p.username}</p>
                                <p className="text-sm text-green-300">Chips: ${p.chips}</p>
                                {isWinner && winnerInfo && (
                                    <p className="text-xs text-green-200 mt-1">
                                        Winner: {winnerInfo.handResult.name} ({winnerInfo.handResult.rank})
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Game Controls */}
            <div className="absolute bottom-6 flex flex-wrap justify-center gap-3 z-10">
                <button onClick={handleStartGame} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition" >
                    {isGameStarted ? <span>🎲 Re-Start Game</span> : <span>🎲 Start Game</span>}
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
        </div>
    );
}

export default GamePage;
