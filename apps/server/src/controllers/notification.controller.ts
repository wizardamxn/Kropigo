import { Request, Response } from 'express'
import Notification from '../models/Notification.model'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/ApiError'

export const getPagination = (pageStr: string, limitStr: string) => {
  const page = parseInt(pageStr, 10) || 1
  const limitNum = parseInt(limitStr, 10) || 20
  const skip = (page - 1) * limitNum
  return { skip, limitNum }
}

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', unreadOnly } = req.query
  const { skip, limitNum } = getPagination(page as string, limit as string)

  // Admin sees all admin-targeted notifications; others see only their own.
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
})

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const filter: any = { isRead: false }

  if (req.user?.role === 'admin') {
    filter.targetRole = 'admin'
  } else {
    filter.targetUserId = req.user?.userId
  }

  const count = await Notification.countDocuments(filter)

  res.status(200).json({ success: true, count })
})

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findById(req.params.id)

  if (!notification) throw new ApiError(404, 'Notification not found')

  // Verify ownership — admin can mark admin notifications; users only their own.
  const userId = req.user?.userId;
  const canMark =
    (req.user?.role === 'admin' && notification.targetRole === 'admin') ||
    (notification.targetUserId?.toString() === userId)

  if (!canMark) throw new ApiError(403, 'Unauthorized')

  notification.isRead = true
  await notification.save()

  res.status(200).json({ success: true, message: 'Marked as read' })
})

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const filter: any = { isRead: false }

  if (req.user?.role === 'admin') {
    filter.targetRole = 'admin'
  } else {
    filter.targetUserId = req.user?.userId
  }

  await Notification.updateMany(filter, { isRead: true })

  res.status(200).json({ success: true, message: 'All notifications marked as read' })
})
