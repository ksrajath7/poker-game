import socket from "@/lib/socket";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { _retrieveData, _storeData } from "@/lib/local-storage";

function HomePage() {
    const { joinedTableId } = useParams();
    const navigate = useNavigate()
    const [players, setPlayers] = useState([]);
    const [username, setUsername] = useState(_retrieveData('username', 'string') || '');
    const [tableId, setTableId] = useState('');
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [isCreatingTable, setIsCreatingTable] = useState(false);

    function generateNewId() {
        return 'user-' + Math.random().toString(36).substr(2, 9);
    }

    useEffect(() => {
        socket.on('tableCreated', ({ tableId }) => {
            setIsCreatingTable(false);
            setIsJoining(false);
            navigate(`/table/${tableId}`)
        });

        socket.on('joinedTable', ({ tableId, players }) => {
            setIsJoining(false);
            setIsCreatingTable(false);
            navigate(`/table/${tableId}`)
        });

        socket.on('error', ({ message }) => {
            setError(message);
            setIsJoining(false);
            setIsCreatingTable(false);
        });

        return () => {
            socket.off('tableCreated');
            socket.off('joinedTable');
            socket.off('error');
        };
    }, [navigate]);

    const handleJoinTable = () => {
        setError('');
        const userId = _retrieveData('userId', 'string') || generateNewId();
        _storeData('userId', userId, 'string');
        _storeData('username', username, 'string');

        if (tableId.trim()) {
            setIsJoining(true);
            socket.emit('joinTable', { tableId: tableId.trim(), userId, username });
        } else {
            setError('Please enter a valid table ID.');
        }
    };
    const handleCreateTable = () => {
        setError('');
        const userId = _retrieveData('userId', 'string') || generateNewId();
        _storeData('userId', userId, 'string');
        _storeData('username', username, 'string');

        if (userId.trim()) {
            setIsCreatingTable(true);
            setIsJoining(true);
            socket.emit('createTable', { userId, username });
        } else {
            setError('Something went wrong!');
        }
    };

    useEffect(() => {
        if (joinedTableId) {
            setTableId(joinedTableId)
        }
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-600 to-pink-500 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6">
                <h1 className="text-3xl font-bold text-center text-gray-800">🎴 Poker Table</h1>

                {error && (
                    <div className="text-red-600 font-medium text-center">{error}</div>
                )}

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
                    />

                    <input
                        type="text"
                        placeholder="Enter Table ID"
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {!joinedTableId && <button
                        onClick={handleCreateTable}
                        disabled={isCreatingTable}
                        className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-transform transform hover:scale-105 ${isCreatingTable ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                            }`}
                    >
                        {isCreatingTable ? 'Creating...' : 'Create Table'}
                    </button>}


                    <button
                        onClick={handleJoinTable}
                        disabled={isJoining}
                        className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-transform transform hover:scale-105 ${isJoining ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        {isJoining ? 'Joining...' : 'Join Table'}
                    </button>
                </div>

                <div className="text-center text-gray-500 text-sm mt-2">
                    Enter your username and either create a new table or join an existing one.
                </div>
            </div>
        </div>
    );
}

export default HomePage;
