import socket from "@/lib/socket";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { _retrieveData } from "@/lib/local-storage";
import PlayingCard from "../App/PlayingCard";
import Player from "../App/Player";
import WinnerPopup from "../Popups/WinnerPopup";
import TableCodeAndLink from "../App/TableCodeAndLink";
import PokerTable from "../App/PokerTable";
import GameControls from "../App/GameControls";

function GamePage() {
    const { joinedTableId } = useParams();
    const navigate = useNavigate();

    const [showWinnerPopup, setShowWinnerPopup] = useState(false);

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
        socket.on("playerJoined", ({ players }) => { setPlayers(players) });
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
            if (winnerArray.winners) {
                console.log(winnerArray)
                setWinners(winnerArray.winners);
                setShowWinnerPopup(true)
            }
            else {
                setWinners([])
                setShowWinnerPopup(false)
            };
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
    const handleCall = () => {
        socket.emit("bet", { tableId: joinedTableId, userId, amount: currentBet, action: "call" });
    };

    const handleRaise = () => {
        if (betAmount < currentBet) {
            alert(`Raise must be at least ${currentBet}`);
            return;
        }
        socket.emit("bet", { tableId: joinedTableId, userId, amount: betAmount, action: "raise" });
        setBetAmount(0);
    };

    const handleFold = () => socket.emit("bet", { tableId: joinedTableId, userId, action: "fold" });
    const handleNextStage = () => socket.emit("nextStage", { tableId: joinedTableId });
    const handleShowdown = () => socket.emit("showdown", { tableId: joinedTableId });
    const handleExitGame = () => socket.emit("exitGame", { tableId: joinedTableId, userId });


    // -------------------------------
    // UI
    // -------------------------------
    return (
        <div className="min-h-[100svh] overflow-auto bg-gradient-to-br from-gray-900 to-black text-white relative flex items-center justify-center">

            {/* Winner Popup */}
            <WinnerPopup showWinnerPopup={showWinnerPopup} winners={winners} setShowWinnerPopup={setShowWinnerPopup} />

            {/* Top-Left Table Invite */}
            <TableCodeAndLink joinedTableId={joinedTableId} />

            {/* Exit Button */}
            <button onClick={handleExitGame} className="absolute top-4 right-4 z-50 px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 transition">🚪 Exit</button>

            {/* Poker Table */}
            <PokerTable communityCards={communityCards} currentBet={currentBet} currentTurn={currentTurn} hand={hand} players={[...players,]} pot={pot} userId={userId} winners={winners} />

            {/* Game Controls */}
            <GameControls betAmount={betAmount} bettingRoundActive={bettingRoundActive} currentBet={currentBet} currentTurn={currentTurn}
                handleCall={handleCall} handleFold={handleFold} handleNextStage={handleNextStage} handleRaise={handleRaise} handleShowdown={handleShowdown}
                handleStartGame={handleStartGame} isGameStarted={isGameStarted} setBetAmount={setBetAmount} stage={stage} userId={userId} />

        </div>
    );
}

export default GamePage;
