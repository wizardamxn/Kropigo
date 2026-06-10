import Notification from '../models/Notification.model';
import { io } from '../index';

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
    message: params.message,
    createdAt: notification.createdAt,
    ...params.payload
  })

  return notification
}
