export const SOCKET_EVENTS = {
  // Server → Client events
  NEW_DEAL: 'new_deal',
  ORDER_STATUS_UPDATED: 'order_status_updated',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
  NEW_OFFER_RECEIVED: 'new_offer_received',
} as const;
