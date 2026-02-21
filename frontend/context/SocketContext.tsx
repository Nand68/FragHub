import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket.service';

type SocketContextValue = {
    socket: Socket | null;
    connected: boolean;
};

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accessToken, user } = useAuth();
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (accessToken && user) {
            const s = connectSocket(accessToken);
            socketRef.current = s;

            s.on('connect', () => setConnected(true));
            s.on('disconnect', () => setConnected(false));

            return () => {
                s.off('connect');
                s.off('disconnect');
                disconnectSocket();
                socketRef.current = null;
                setConnected(false);
            };
        } else {
            // Logged out — tear down socket
            disconnectSocket();
            socketRef.current = null;
            setConnected(false);
        }
    }, [accessToken, user?.id]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
