import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: string;
  message: string;
  payload: any;
  isRead: boolean;
  timestamp: string; // ISO string — plain object safe for Redux
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Check if already exists by id
      const exists = state.notifications.some(n => n.id === action.payload.id)
      if (!exists) {
        state.notifications.unshift(action.payload)
        if (!action.payload.isRead) {
          state.unreadCount += 1
        }
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },
    markOneRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAllRead, markOneRead, clearNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
