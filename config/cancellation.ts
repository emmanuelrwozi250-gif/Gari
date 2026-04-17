export const CANCELLATION_POLICY = {
  /** Renter can cancel for free within this many hours of booking creation */
  RENTER_FREE_WINDOW_HOURS: 24,
  /** Refund % if renter cancels after free window but before trip */
  RENTER_PARTIAL_REFUND_PERCENT: 50,
  /** Renter always gets 100% refund when host cancels */
  HOST_CANCEL_RENTER_REFUND: 100,
  /** Hosts who cancel get flagged / penalized */
  HOST_CANCEL_PENALTY: true,
  /** Hours host has to respond before booking is auto-rejected */
  HOST_NO_RESPONSE_HOURS: 24,
  /** Renter refund % if host doesn't respond in time */
  HOST_NO_RESPONSE_REFUND: 100,
  /** Hours after trip ends before deposit is auto-released */
  DEPOSIT_REFUND_HOURS: 48,
} as const;
