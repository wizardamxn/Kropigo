/**
 * Money formatting for amounts that arrive from the API.
 *
 * Every numeric field here is typed as a required `number`, but orders predating
 * the current schema come back without one. Rendering those crashed the screen,
 * and showing ₹0 would state a price the record never actually held — so a
 * missing amount reads as a dash instead. A stored 0 is a real amount and still
 * formats as ₹0.
 */

/** Shown in place of an amount the record never stored. */
const MISSING = '—';

/** Indian-grouped amount prefixed with ₹, or a dash when there is none. */
export const rupees = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? `₹${value.toLocaleString('en-IN')}` : MISSING;
