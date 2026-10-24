import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { TokenPayload } from '@nexus/shared';

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    const orgRoom = `org:${user.org}`;

    // Join organization room — all events scoped per org
    socket.join(orgRoom);
    logger.debug({ userId: user.sub, org: user.org }, 'Socket connected');

    socket.on('disconnect', () => {
      logger.debug({ userId: user.sub }, 'Socket disconnected');
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// ─── Event Emitters ───────────────────────────────────────────────────────────
// Call these from services/jobs to broadcast real-time events to org members

export function emitInventoryUpdated(
  orgId: string,
  payload: { productId: string; warehouseId: string; onHand: number; available: number }
): void {
  getIO().to(`org:${orgId}`).emit('inventory.updated', payload);
}

export function emitPOUpdated(
  orgId: string,
  payload: { poId: string; status: string }
): void {
  getIO().to(`org:${orgId}`).emit('purchaseOrder.updated', payload);
}

export function emitShipmentDelayed(
  orgId: string,
  payload: { shipmentId: string; newEta: string; slippageDays: number }
): void {
  getIO().to(`org:${orgId}`).emit('shipment.delayed', payload);
}

export function emitStockoutDetected(
  orgId: string,
  payload: { productId: string; warehouseId: string; projectedDate: string }
): void {
  getIO().to(`org:${orgId}`).emit('stockout.detected', payload);
}

export function emitAlertCreated(
  orgId: string,
  payload: { alertId: string; severity: string; type: string; title: string }
): void {
  getIO().to(`org:${orgId}`).emit('alert.created', payload);
}

export function emitGoodsReceiptCreated(
  orgId: string,
  payload: { receiptId: string; poId: string }
): void {
  getIO().to(`org:${orgId}`).emit('goodsReceipt.created', payload);
}
