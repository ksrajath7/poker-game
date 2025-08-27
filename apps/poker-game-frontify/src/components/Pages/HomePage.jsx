import socket from "@/lib/socket";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { _retrieveData, _storeData } from "@/lib/local-storage";

function HomePage() {
    const navigate = useNavigate()
    const [players, setPlayers] = useState([]);
    const [username, setUsername] = useState('');
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
            console.error('Join error:', message);
            setError(message);
            setIsJoining(false);
            setIsCreatingTable(false);
        });

        return () => {
            socket.off('tableCreated');
            socket.off('joinedTable');
            socket.off('error');
        };
    }, []);

    const handleJoinTable = () => {
        setError('');
        const userId = _retrieveData('userId', 'string') || generateNewId();
        _storeData('userId', userId, 'string');

        if (tableId.trim()) {
            setIsJoining(true);
            socket.emit('joinTable', { tableId: tableId.trim(), userId, username });
        } else {
            setIsJoining(false);
            setError('Please enter a valid table ID.');
        }
    };
    const handleCreateTable = () => {
        setError('');
        const userId = _retrieveData('userId', 'string') || generateNewId();
        _storeData('userId', userId, 'string');

        if (userId.trim()) {
            setIsCreatingTable(true);
            setIsJoining(true);
            socket.emit('createTable', { userId, username });
        } else {
            setIsCreatingTable(false);
            setIsJoining(false);
            setError('Something went wrong!');
        }
    };

    return (
        <div className="min-h-[100svh] bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <div className="mb-4">

                    <button
                        onClick={handleCreateTable}
                        disabled={isCreatingTable}
                        className={`px-4 py-1 rounded text-white ${isCreatingTable ? 'bg-gray-400' : 'bg-blue-500'
                            }`}
                    >
                        {isCreatingTable ? 'Creating...' : 'Create Table'}
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="border px-2 py-1 rounded mr-2"
                    />
                    <input
                        type="text"
                        placeholder="Enter Table ID"
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                        className="border px-2 py-1 rounded mr-2"
                    />
                    <button
                        onClick={handleJoinTable}
                        disabled={isJoining}
                        className={`px-4 py-1 rounded text-white ${isJoining ? 'bg-gray-400' : 'bg-blue-500'
                            }`}
                    >
                        {isJoining ? 'Joining...' : 'Join Table'}
                    </button>
                </div>

                {error && (
                    <div className="text-red-600 font-medium mb-4">{error}</div>
                )}


            </main>
        </div>
    );
}

export default HomePage;