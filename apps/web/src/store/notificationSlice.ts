import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearUser } from './slices/authSlice';

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
      const existingIndex = state.notifications.findIndex(n => n.id === action.payload.id);
      if (existingIndex > -1) {
        const oldIsRead = state.notifications[existingIndex].isRead;
        state.notifications[existingIndex] = action.payload;
        if (oldIsRead !== action.payload.isRead) {
          if (action.payload.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          } else {
            state.unreadCount += 1;
          }
        }
      } else {
        state.notifications.push(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
      state.notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
  extraReducers: (builder) => {
    // Logout: drop the previous user's notifications so they don't leak
    // into the next session in the same tab.
    builder.addCase(clearUser, () => initialState);
  },
});

export const { addNotification, markAllRead, markOneRead, clearNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
