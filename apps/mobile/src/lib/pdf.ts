import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { Order } from '@/store/ordersApi';
import type { Listing } from '@/store/marketplaceApi';
import type { DailyStatement } from '@/store/statementsApi';
import { rupees } from '@/lib/format';

const longDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/** Escapes user-supplied text before it goes into the generated HTML. */
const esc = (value: unknown) =>
  String(value ?? '—').replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

const DOC_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Helvetica Neue', sans-serif; color: #1c1917; margin: 0; padding: 32px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e7e5e4; padding-bottom: 20px; margin-bottom: 24px; }
  .brand { font-size: 26px; font-weight: 800; color: #166534; margin: 0; }
  .brand-sub { font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: #a8a29e; margin: 2px 0 0; }
  .doc-title { font-size: 26px; font-weight: 800; margin: 0; text-align: right; }
  .doc-id { font-size: 10px; color: #a8a29e; font-family: monospace; margin: 4px 0 0; text-align: right; }
  .grid { display: flex; gap: 16px; margin-bottom: 24px; }
  .panel { flex: 1; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 14px; }
  .cap { font-size: 9px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #a8a29e; margin: 0 0 8px; }
  .row { display: flex; gap: 8px; font-size: 12px; margin-bottom: 3px; }
  .row dt { color: #a8a29e; width: 62px; flex-shrink: 0; margin: 0; }
  .row dd { margin: 0; color: #292524; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #78716c; border-bottom: 2px solid #e7e5e4; padding-bottom: 8px; }
  td { padding: 10px 0; border-bottom: 1px solid #f5f5f4; }
  .right { text-align: right; }
  .total { font-size: 19px; font-weight: 800; color: #166534; }
  .foot { border-top: 1px solid #e7e5e4; margin-top: 28px; padding-top: 12px; text-align: center; font-size: 9px; color: #a8a29e; }
`;

const wrap = (title: string, body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <title>${esc(title)}</title><style>${DOC_STYLES}</style></head><body>${body}</body></html>`;

const party = (label: string, person?: { name?: string; phone?: string; location?: string }) => `
  <div class="panel">
    <p class="cap">${esc(label)}</p>
    <dl style="margin:0">
      <div class="row"><dt>Name</dt><dd>${esc(person?.name)}</dd></div>
      ${person?.phone ? `<div class="row"><dt>Phone</dt><dd>${esc(person.phone)}</dd></div>` : ''}
      ${person?.location ? `<div class="row"><dt>District</dt><dd>${esc(person.location)}</dd></div>` : ''}
    </dl>
  </div>`;

export const buildInvoiceHtml = (order: Order): string => {
  const listing = typeof order.listingId === 'string' ? undefined : (order.listingId as Listing);
  const crop = listing && typeof listing.cropId !== 'string' ? listing.cropId.name : 'Crop';
  const seller = typeof order.sellerId === 'string' ? undefined : order.sellerId;
  const buyer = typeof order.buyerId === 'string' ? undefined : order.buyerId;
  const delivered = [...(order.timeline ?? [])].reverse().find((entry) => entry.status === 'delivered');

  return wrap(`KropiGo invoice ${order._id}`, `
    <div class="head">
      <div><p class="brand">KropiGo</p><p class="brand-sub">Agricultural Marketplace</p></div>
      <div><p class="doc-title">Invoice</p><p class="doc-id">${esc(order._id)}</p></div>
    </div>

    <div class="grid">
      <div style="flex:1"><p class="cap">Order date</p><p style="margin:0;font-size:13px;font-weight:500">${longDate(order.createdAt)}</p></div>
      ${delivered ? `<div style="flex:1"><p class="cap">Delivered on</p><p style="margin:0;font-size:13px;font-weight:500">${longDate(delivered.timestamp)}</p></div>` : '<div style="flex:1"></div>'}
    </div>

    <div class="grid">${party('Seller', seller)}${party('Buyer', buyer)}</div>

    <table>
      <thead><tr><th>Crop</th><th class="right">Quantity</th><th class="right">Agreed rate</th><th class="right">Total</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>${esc(crop)}</strong>${listing?.variety ? `<br/><span style="color:#a8a29e;font-size:10px">${esc(listing.variety)}</span>` : ''}</td>
          <td class="right">${order.quantity} ${esc(order.unit)}</td>
          <td class="right">${rupees(order.agreedPrice)}/${esc(order.unit)}</td>
          <td class="right"><strong>${rupees(order.totalAmount)}</strong></td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td colspan="3" class="right" style="padding-top:16px;font-weight:600">Total</td>
        <td class="right total" style="padding-top:16px">${rupees(order.totalAmount)}</td></tr>
      </tfoot>
    </table>

    <p class="foot">This is a system-generated document from KropiGo and does not require a signature.</p>
  `);
};

export const buildStatementHtml = (
  statements: DailyStatement[],
  summary: { lifetimeSales: number; lifetimeAmount: number },
  farmerName?: string,
): string => {
  const rows = statements
    .flatMap((statement) =>
      statement.entries.map((entry) => `
        <tr>
          <td>${esc(statement.dateKey)}</td>
          <td><strong>${esc(entry.cropName)}</strong>${entry.grade ? ` <span style="color:#a8a29e">· ${esc(entry.grade)}</span>` : ''}</td>
          <td class="right">${entry.quantity} ${esc(entry.unit)}</td>
          <td class="right">${rupees(entry.agreedPrice)}</td>
          <td class="right"><strong>${rupees(entry.totalAmount)}</strong></td>
        </tr>`),
    )
    .join('');

  return wrap('KropiGo statement', `
    <div class="head">
      <div><p class="brand">KropiGo</p><p class="brand-sub">Agricultural Marketplace</p></div>
      <div><p class="doc-title">Statement</p><p class="doc-id">${esc(farmerName)}</p></div>
    </div>

    <div class="grid">
      <div class="panel"><p class="cap">Lifetime sales</p><p style="margin:0" class="total">${summary.lifetimeSales}</p></div>
      <div class="panel"><p class="cap">Lifetime earnings</p><p style="margin:0" class="total">${rupees(summary.lifetimeAmount)}</p></div>
    </div>

    <table>
      <thead><tr><th>Date</th><th>Crop</th><th class="right">Quantity</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="color:#a8a29e;padding:16px 0">No sales recorded yet.</td></tr>'}</tbody>
    </table>

    <p class="foot">Generated ${longDate(new Date().toISOString())} · KropiGo daily statement</p>
  `);
};

/**
 * Renders HTML to a PDF and opens the native share sheet. Falls back to the
 * system print dialog on devices without a sharing target.
 */
export const sharePdf = async (html: string, fileName: string): Promise<void> => {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
    } else {
      await Print.printAsync({ html });
    }
  } catch (error) {
    Alert.alert("Couldn't create the PDF", error instanceof Error ? error.message : 'Please try again.');
  }
};
