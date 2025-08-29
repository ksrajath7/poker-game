import { useState, useEffect } from "react";

function ChipRequestBadge({ player, setShowChipRequests, setPendingChipRequests }) {
    const [shake, setShake] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setShake(true);             // start shake
            setTimeout(() => setShake(false), 500); // stop shake after 0.5s
        }, 3000); // repeat every 3s

        return () => clearInterval(interval);
    }, []);

    return (
        <p className="font-semibold text-white text-sm mt-2 my-1 relative">
            {player.pendingChipRequests && player.pendingChipRequests.length > 0 &&


                <span
                    className={`px-2 py-0.5 text-[10px] bg-purple-600 rounded-full cursor-pointer flex items-center justify-center 
            ${shake ? 'animate-shakeOnce' : ''}`}
                    onClick={() => {
                        setShowChipRequests(true)
                        setPendingChipRequests(player.pendingChipRequests)
                    }}
                >
                    Chip requests
                    <span className="absolute -top-2 -right-2 bg-white text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {player.pendingChipRequests.length}
                    </span>
                </span>
            }
        </p>
    )
}

export default ChipRequestBadge;
