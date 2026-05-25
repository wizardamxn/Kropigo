import { Router } from 'express'
import { 
  getNotifications, 
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount
} from '../controllers/notification.controller'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()

// All authenticated users can get their own notifications
router.get('/', authenticate, getNotifications)
router.get('/unread-count', authenticate, getUnreadCount)
router.patch('/:id/read', authenticate, markNotificationRead)
router.patch('/read-all', authenticate, markAllNotificationsRead)

export default router
