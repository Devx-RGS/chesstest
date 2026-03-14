import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from '../lib/constants';

interface UseSocketOptions {
  namespace: string;
  auth: Record<string, string>;
  autoConnect?: boolean;
}

export function useSocket({ namespace, auth, autoConnect = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const url = `${WS_BASE_URL}${namespace}`;
    console.log(`[Socket] Connecting to ${url}`, auth);

    const socket = io(url, {
      auth,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to ${namespace}: ${socket.id}`);
    });

    socket.on('connect_error', (err) => {
      console.error(`[Socket] Connection error on ${namespace}:`, err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected from ${namespace}:`, reason);
    });

    socketRef.current = socket;

    return () => {
      console.log(`[Socket] Cleaning up ${namespace}`);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [namespace, JSON.stringify(auth), autoConnect]);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.removeAllListeners(event);
    }
  }, []);

  return { socket: socketRef, emit, on, off };
}
