import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { queryClient } from './queryClient';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new Error('Cannot connect socket without auth token');

  if (socket?.connected) return socket;

  const socketUrl = import.meta.env.VITE_API_URL || '/';
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.debug('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[Socket] Disconnected:', reason);
  });

  // ── Real-time handlers ──────────────────────────────────────────────
  socket.on('inventory.updated', ({ productId, warehouseId }: any) => {
    queryClient.invalidateQueries({ queryKey: ['inventory', productId, warehouseId] });
    queryClient.invalidateQueries({ queryKey: ['inventory', 'runway'] });
  });

  socket.on('purchaseOrder.updated', ({ poId }: any) => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-orders', poId] });
  });

  socket.on('shipment.delayed', () => {
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
  });

  socket.on('stockout.detected', () => {
    queryClient.invalidateQueries({ queryKey: ['inventory', 'runway'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  });

  socket.on('alert.created', () => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  });

  socket.on('goodsReceipt.created', ({ poId }: any) => {
    queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-orders', poId] });
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
