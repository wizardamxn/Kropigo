import { Request, Response } from 'express'
import Notification from '../models/Notification.model'

// Assuming pagination utility exists in utils/pagination
export const getPagination = (pageStr: string, limitStr: string) => {
  const page = parseInt(pageStr, 10) || 1
  const limitNum = parseInt(limitStr, 10) || 20
  const skip = (page - 1) * limitNum
  return { skip, limitNum }
}

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query
    const { skip, limitNum } = getPagination(page as string, limit as string)

    // Build filter based on who is requesting
    // Admin sees all admin-targeted notifications
    // Kisan/buyer see only their own
    const filter: any = {}

    if (req.user?.role === 'admin') {
      filter.targetRole = 'admin'
    } else {
      filter.targetUserId = req.user?.userId
    }

    if (unreadOnly === 'true') {
      filter.isRead = false
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(filter)
    ])

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const filter: any = { isRead: false }

    if (req.user?.role === 'admin') {
      filter.targetRole = 'admin'
    } else {
      filter.targetUserId = req.user?.userId
    }

    const count = await Notification.countDocuments(filter)

    res.status(200).json({ 
      success: true, 
      count 
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      })
      return;
    }

    // Verify ownership — admin can mark admin notifications
    // Users can only mark their own
    const userId = req.user?.userId;
    const canMark = 
      (req.user?.role === 'admin' && notification.targetRole === 'admin') ||
      (notification.targetUserId?.toString() === userId)

    if (!canMark) {
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      })
      return;
    }

    notification.isRead = true
    await notification.save()

    res.status(200).json({ 
      success: true, 
      message: 'Marked as read' 
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const filter: any = { isRead: false }

    if (req.user?.role === 'admin') {
      filter.targetRole = 'admin'
    } else {
      filter.targetUserId = req.user?.userId
    }

    await Notification.updateMany(filter, { isRead: true })

    res.status(200).json({ 
      success: true, 
      message: 'All notifications marked as read' 
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
