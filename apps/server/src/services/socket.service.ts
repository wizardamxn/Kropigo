import Notification from '../models/Notification.model';
import { io } from '../index';
import { SOCKET_EVENTS } from '../utils/socketEvents';

export const createAndEmitNotification = async (params: {
  type: string
  message: string
  payload: Record<string, any>
  targetRole: 'admin' | 'kisan' | 'buyer'
  targetUserId?: string | null
  orderId?: string | null
  listingId?: string | null
}) => {
  // 1. Save to DB so offline users see it on next login
  const notification = await Notification.create({
    type: params.type,
    message: params.message,
    payload: params.payload,
    targetRole: params.targetRole,
    targetUserId: params.targetUserId || null,
    orderId: params.orderId || null,
    listingId: params.listingId || null,
    isRead: false
  })

  // 2. Emit via socket to online users
  const roomTarget = params.targetUserId 
    ? params.targetUserId          // specific user's room
    : `${params.targetRole}_room`  // all users of that role

  io.to(roomTarget).emit(params.type, {
    notificationId: notification._id,
    ...params.payload
  })

  return notification
}

// ─── Admin: new deal created ──────────────────────────────────────────────────
export const emitNewDealToAdmin = (payload: {
  orderId: string;
  kisanName: string;
  kisanPhone: string;
  buyerName: string;
  buyerPhone: string;
  cropName: string;
  quantity: number;
  unit: string;
  agreedPrice: number;
  totalAmount: number;
  farmAddress: string;
  farmDistrict: string;
  farmState: string;
  createdAt: Date;
}) => {
  io.to('admin_room').emit(SOCKET_EVENTS.NEW_DEAL, payload);
};

// ─── Buyer: offer was accepted ────────────────────────────────────────────────
export const emitOfferAcceptedToBuyer = (
  buyerUserId: string,
  payload: {
    orderId: string;
    cropName: string;
    quantity: number;
    unit: string;
    agreedPrice: number;
    totalAmount: number;
  }
) => {
  io.to(buyerUserId).emit(SOCKET_EVENTS.OFFER_ACCEPTED, payload);
};

// ─── Kisan: deal confirmed ────────────────────────────────────────────────────
export const emitDealConfirmedToKisan = (
  kisanUserId: string,
  payload: {
    orderId: string;
    cropName: string;
    quantity: number;
    unit: string;
    agreedPrice: number;
    totalAmount: number;
  }
) => {
  io.to(kisanUserId).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
};

// ─── Buyer: order status changed ─────────────────────────────────────────────
export const emitOrderStatusToBuyer = (
  buyerUserId: string,
  payload: {
    orderId: string;
    status: string;
    note: string | null;
    timestamp: Date;
  }
) => {
  io.to(buyerUserId).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
};

// ─── Kisan: order status changed ─────────────────────────────────────────────
export const emitOrderStatusToKisan = (
  kisanUserId: string,
  payload: {
    orderId: string;
    status: string;
    note: string | null;
    timestamp: Date;
  }
) => {
  io.to(kisanUserId).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
};

// ─── Kisan: new offer received on listing ────────────────────────────────────
export const emitNewOfferToKisan = (
  kisanUserId: string,
  payload: {
    listingId: string;
    cropName: string;
    buyerName: string;
    offeredPrice: number;
    quantity: number;
  }
) => {
  io.to(kisanUserId).emit(SOCKET_EVENTS.NEW_OFFER_RECEIVED, payload);
};
