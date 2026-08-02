import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearUser } from './authSlice';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  timestamp: string;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationState = { items: [], unreadCount: 0 };

const sortNewestFirst = (items: AppNotification[]) => items.sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      state.items = sortNewestFirst(action.payload);
      state.unreadCount = state.items.filter((item) => !item.isRead).length;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      const existing = state.items.findIndex((item) => item.id === action.payload.id);
      if (existing >= 0) state.items[existing] = action.payload;
      else state.items.unshift(action.payload);
      sortNewestFirst(state.items);
      state.unreadCount = state.items.filter((item) => !item.isRead).length;
    },
    markOneRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((item) => item.id === action.payload);
      if (notification) notification.isRead = true;
      state.unreadCount = state.items.filter((item) => !item.isRead).length;
    },
    markAllRead: (state) => {
      state.items.forEach((item) => { item.isRead = true; });
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => builder.addCase(clearUser, () => initialState),
});

export const { setNotifications, setUnreadCount, addNotification, markOneRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
