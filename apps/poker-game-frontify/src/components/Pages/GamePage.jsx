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
import BetHistoryNotifications from "../App/BetHistoryNotifications";

function GamePage() {
    const { joinedTableId } = useParams();
    const navigate = useNavigate();

    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const [showChipRequests, setShowChipRequests] = useState(false);
    const [showChipRequestPopup, setShowChipRequestPopup] = useState(false);
    const [pendingChipRequests, setPendingChipRequests] = useState([]);
    const [requestAmount, setRequestAmount] = useState(0);
    const [borrowerId, setBorrowerId] = useState('');
    const [lenderId, setLenderId] = useState('');
    const [interestRate, setInterestRate] = useState(10);

    const [debtsOwed, setDebtsOwed] = useState([]); // debts the user owes
    const [debtsLent, setDebtsLent] = useState([]); // debts others owe the user

    const [players, setPlayers] = useState([]);
    const [betHistory, setBetHistory] = useState([]);
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
    const [tableOwnerId, setTableOwnerId] = useState('');

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
            setTableOwnerId(table.ownerId)
            if (table?.currentPlayer) {
                setCurrentTurn(table.currentPlayer.userId)
            }
            setPlayers(table.players);
            setCommunityCards(table.communityCards);
            setPot(table.pot);
            setCurrentBet(table.currentBet || 10);
            setIsGameStarted(table.isGameStarted);
            setStage(table.stage || "preflop");
            setBettingRoundActive(table.bettingRoundActive || false);

            const me = table.players.find(p => p.userId === userId);
            setHand(me?.hand || []);
            setError("")
        });

        socket.on("tableDetails", ({ players, ownerId, communityCards, pot, currentBet, isGameStarted, stage, bettingRoundActive, betHistory, currentPlayer }) => {
            setTableOwnerId(ownerId)
            if (currentPlayer) {
                setCurrentTurn(currentPlayer.userId)
            }
            setPlayers(players);
            setCommunityCards(communityCards);
            setPot(pot);
            setCurrentBet(currentBet || 10);
            setIsGameStarted(isGameStarted);
            setStage(stage || "preflop");
            setBettingRoundActive(bettingRoundActive || false);

            const me = players.find(p => p.userId === userId);
            setHand(me?.hand || []);

            setBetHistory(
                betHistory.map(item => {
                    return {
                        ...item,
                        formattedTime: new Date(item.timestamp).toLocaleString()
                    };
                })
            );
            // Disable controls if waiting
            if (me?.isWaiting) {
                setError("You are waiting for the next hand to start.");
            } else {
                setError("");
            }
        });

        socket.on("debtUpdated", ({ borrowerId, lenderId, debts, borrowerChips, lenderChips }) => {
            // Update debts state if current user is involved
            if (borrowerId === userId) setDebtsOwed(debts);
            if (lenderId === userId) setDebtsLent(debts);

            // Update chips for players in UI
            setPlayers(prev =>
                prev.map(p => {
                    if (p.userId === borrowerId) return { ...p, chips: borrowerChips };
                    if (p.userId === lenderId) return { ...p, chips: lenderChips };
                    return p;
                })
            );
            const tempPendingChipRequests = pendingChipRequests.filter(req => req.borrowerId !== borrowerId)
            setPendingChipRequests(tempPendingChipRequests)
        });

        socket.on("debtSettled", ({ borrowerId, lenderId, amount, interest }) => {
            // Remove settled debts from state
            if (borrowerId === userId) {
                setDebtsOwed(prev => prev.filter(d => d.lenderId !== lenderId));
            }
            if (lenderId === userId) {
                setDebtsLent(prev => prev.filter(d => d.borrowerId !== borrowerId));
            }

            // Update chips for players
            setPlayers(prev =>
                prev.map(p => {
                    if (p.userId === borrowerId) return { ...p, chips: p.chips - (amount + interest) };
                    if (p.userId === lenderId) return { ...p, chips: p.chips + (amount + interest) };
                    return p;
                })
            );
        });


        socket.on("yourHand", ({ hand }) => { setHand(hand); setError("") });
        socket.on("playerJoined", ({ players }) => { setPlayers(players); setError("") });
        socket.on("playerLeft", ({ players }) => { setPlayers(players); setError("") });
        socket.on("betPlaced", ({ pot, currentBet, bettingRoundActive }) => {
            setPot(pot);
            setCurrentBet(currentBet);
            setBettingRoundActive(bettingRoundActive);
            setError("")
        });
        socket.on("communityCards", ({ cards, stage }) => {
            setCommunityCards(cards);
            setStage(stage);
            setError("")
        });
        socket.on("playerTurn", ({ userId }) => { setCurrentTurn(userId); setError("") });
        socket.on("bettingRoundComplete", () => { setBettingRoundActive(false); setError("") });
        socket.on("winner", winnerArray => {
            if (winnerArray.winners) {
                setWinners(winnerArray.winners);
                setShowWinnerPopup(true)
            }
            else {
                setWinners([])
                setShowWinnerPopup(false)
            };
            setStage("showdown");
            setError("")
        });

        socket.on("removedFromTable", () => navigate("/"));
        socket.on("error", ({ message }) => { setError(message); setError("") });

        socket.io.on("reconnect", () => {
            socket.emit("joinTable", { tableId: joinedTableId, userId, username });
        });

        socket.on("waitingForNextHand", ({ message }) => {
            setError(message); // Or show a toast/modal if you have one
            setHand([]); // Ensure no hand is shown yet
        });

        socket.on("readyForNextHand", ({ message }) => {
            console.log(message);
            setError("");
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
            socket.io.off("debtUpdated");
            socket.io.off("debtSettled");
            socket.io.off("reconnect");
            socket.off("waitingForNextHand");
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
        const raiseAmount = betAmount - currentBet;
        if (raiseAmount <= 0) {
            alert(`Your total bet must be greater than the current bet of ₵${currentBet}`);
            return;
        }
        socket.emit("bet", {
            tableId: joinedTableId,
            userId,
            amount: raiseAmount, // total bet amount
            action: "raise"
        });

        setBetAmount(0);
    };

    const handleFold = () => socket.emit("bet", { tableId: joinedTableId, userId, action: "fold" });
    const handleNextStage = () => socket.emit("nextStage", { tableId: joinedTableId });
    const handleShowdown = () => socket.emit("showdown", { tableId: joinedTableId });
    const handleExitGame = () => socket.emit("exitGame", { tableId: joinedTableId, userId });
    const handleDonateChips = (borrowerId, amount) => {

        const intRate = interestRate / 100
        socket.emit("donate", { tableId: joinedTableId, borrowerId, lenderId: userId, amount, interestRate: intRate })
        // setInterestRate(0);
        // setShowChipRequests(false)
    };
    const handleRequestChips = () => {
        socket.emit("requestChips", { tableId: joinedTableId, borrowerId, lenderId, amount: requestAmount })
        setRequestAmount(0);
        setBorrowerId('');
        setLenderId('');
        setShowChipRequestPopup(false)
    };

    const onClickChipRequest = (borrowerId, lenderId) => {
        setBorrowerId(borrowerId);
        setLenderId(lenderId);
        setShowChipRequestPopup(true)
    }

    // -------------------------------
    // UI
    // -------------------------------
    return (
        <div className=" min-h-[100svh] overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-900 to-black text-white relative flex items-center justify-center">

            {/* Winner Popup */}
            <WinnerPopup myUserId={userId} showWinnerPopup={showWinnerPopup} winners={winners} setShowWinnerPopup={setShowWinnerPopup} />

            {/* Top-Left Table Invite */}
            <TableCodeAndLink joinedTableId={joinedTableId} />

            {/* Exit Button */}
            <button onClick={handleExitGame} className="absolute top-4 right-4 z-50 px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 transition">🚪 Exit</button>

            {/* Poker Table */}
            <PokerTable handleRequestChips={onClickChipRequest} stage={stage}
                pendingChipRequests={pendingChipRequests} setPendingChipRequests={setPendingChipRequests}
                showChipRequests={showChipRequests} setShowChipRequests={setShowChipRequests}
                communityCards={communityCards} currentBet={currentBet} currentTurn={currentTurn}
                hand={hand} players={[...players,]} pot={pot} userId={userId} winners={winners} />

            {/* Game Controls */}
            <GameControls tableOwnerId={tableOwnerId} betAmount={betAmount} bettingRoundActive={bettingRoundActive} currentBet={currentBet} currentTurn={currentTurn}
                handleCall={handleCall} handleFold={handleFold} handleNextStage={handleNextStage} handleRaise={handleRaise} handleShowdown={handleShowdown}
                handleStartGame={handleStartGame} isGameStarted={isGameStarted} setBetAmount={setBetAmount} stage={stage} userId={userId} />



            {showChipRequests && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-white text-black rounded-2xl shadow-2xl p-8 max-w-lg w-full  relative">
                        <h2 className="text-lg font-semibold mb-4">Chip Requests</h2>
                        <p className="mb-2">Interest rate</p>
                        {/* <input
                            type="number"
                            value={interestRate}
                            onChange={(e) => setInterestRate(parseInt(e.target.value))}
                            placeholder={`Min ${currentBet}`}
                            className="px-3 py-2 rounded text-black w-full mb-4 outline-none ring-2 focus:ring-2 focus:ring-green-500"
                            min={0}
                            max={100}
                        /> */}

                        <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from({ length: 11 }, (_, i) => (i) * 10).map((value) => (
                                <span
                                    key={value}
                                    className={`${value == interestRate ? "bg-blue-600 text-white" : "bg-blue-50 text-black"} px-2 py-0.5 text-[10px] rounded-full font-semibold transition-all duration-200 text-sm cursor-pointer hover:bg-blue-700 hover:text-white`}
                                    onClick={() => setInterestRate(value)}
                                >
                                    {value}
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-col">
                            {
                                pendingChipRequests.length > 0 ?
                                    <>
                                        {pendingChipRequests.map(request => (
                                            <div key={request.borrowerId} className="flex flex-row gap-2 justify-between items-start px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                                                <p className="m-0">{request.borrowerName} has requested {request.amount} on {new Date(request.timestamp).toLocaleString()}

                                                </p>
                                                <span className="px-2 py-0.5 text-[10px] bg-blue-600 rounded-full font-semibold text-white text-sm cursor-pointer" onClick={() => {
                                                    handleDonateChips(request.borrowerId, request.amount)
                                                }}>
                                                    Donate
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                    :
                                    <p className="text-center">No requests left</p>
                            }

                        </div>
                        <div className="flex justify-center gap-4 mt-3">

                            <button
                                onClick={() => setShowChipRequests(false)}
                                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500 transition w-1/2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showChipRequestPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-white text-black rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center relative">
                        <h2 className="text-lg font-semibold mb-4">Request Chips</h2>
                        <input
                            type="number"
                            value={requestAmount}
                            onChange={(e) => setRequestAmount(parseInt(e.target.value))}
                            placeholder={`Min ${currentBet}`}
                            className="px-3 py-2 rounded text-black w-full mb-4 outline-none ring-2 focus:ring-2 focus:ring-green-500"
                            min={currentBet}
                        />
                        <div className="flex justify-center gap-4 mt-3">
                            <button
                                onClick={handleRequestChips}
                                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition w-1/2"
                            >
                                ✅ Confirm
                            </button>
                            <button
                                onClick={() => setShowChipRequestPopup(false)}
                                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500 transition w-1/2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <BetHistoryNotifications betHistory={betHistory} />

        </div>
    );
}

export default GamePage;
