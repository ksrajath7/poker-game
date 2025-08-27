import { useEffect, useState } from "react";

export default function BetHistoryNotifications({ betHistory }) {
    const [currentNotification, setCurrentNotification] = useState(null);

    useEffect(() => {
        if (betHistory.length === 0) return;

        const lastBet = betHistory[betHistory.length - 1];
        const newNotification = { ...lastBet, id: Date.now() };

        // Show the new notification
        setCurrentNotification(newNotification);

        // Hide after 6 seconds
        const timer = setTimeout(() => {
            setCurrentNotification(null);
        }, 6000);

        return () => clearTimeout(timer); // Clear previous timer if a new notification comes
    }, [betHistory]);

    if (!currentNotification) return null; // Nothing to show

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end z-50">
            <div
                key={currentNotification.id}
                className="bg-gray-800 text-white p-3 rounded-lg shadow-lg animate-slideIn"
                style={{ animation: "slideIn 0.4s ease-out" }}
            >
                <div className="font-semibold">
                    {currentNotification.playerId} {currentNotification.action.toUpperCase()}
                </div>
                {currentNotification.amount > 0 && (
                    <div className="text-sm">Bet: {currentNotification.amount}</div>
                )}
                <div className="text-xs opacity-70">
                    {currentNotification.stage} • {currentNotification.formattedTime}
                </div>
            </div>
        </div>
    );
}
