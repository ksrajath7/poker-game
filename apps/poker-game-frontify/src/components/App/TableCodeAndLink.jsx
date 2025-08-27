import { useState } from "react";

export default function TableCodeAndLink({ joinedTableId, }) {


    const [isTableInfoOpen, setIsTableInfoOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = (e) => {
        e.stopPropagation(); // Prevent toggling the panel
        navigator.clipboard.writeText(`${window.location.origin}/join/${joinedTableId}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000); // Show "Copied!" for 3 seconds
    };


    return (<div className="absolute top-4 left-4 z-50 w-64">
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
    </div>)
}