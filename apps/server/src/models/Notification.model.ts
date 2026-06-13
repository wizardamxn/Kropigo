import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  type: string
  orderId: mongoose.Types.ObjectId | null
  listingId: mongoose.Types.ObjectId | null
  message: string
  payload: Record<string, any>
  isRead: boolean
  targetRole: string
  targetUserId: mongoose.Types.ObjectId | null
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  type: { 
    type: String, 
    enum: [
      'new_deal',
      'order_status_updated',
      'offer_accepted',
      'offer_rejected',
      'new_offer_received',
      'payment_received',
      'payout_sent',
      'dispute_raised',
      'kisan_verified',
      'kisan_unverified',
      'buyer_verified',
      'buyer_unverified',
    ],
    required: true 
  },
  orderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order', 
    default: null 
  },
  listingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Listing', 
    default: null 
  },
  message: { 
    type: String, 
    required: true 
  },
  payload: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  targetRole: { 
    type: String, 
    enum: ['admin', 'kisan', 'buyer'],
    required: true 
  },
  targetUserId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: null
    // null means it targets all users of targetRole
    // for example targetRole: 'admin', targetUserId: null
    // means all admins see this notification
  }
}, { timestamps: true })

NotificationSchema.index({ targetRole: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ targetUserId: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ orderId: 1 })

export default mongoose.model<INotification>('Notification', NotificationSchema)
