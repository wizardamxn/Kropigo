import mongoose, { Document, Schema } from 'mongoose';

/**
 * A single sale (selling) recorded on a farmer's daily statement.
 * Keyed by orderId so the same sale can never be counted twice.
 */
export interface IStatementEntry {
  orderId: mongoose.Types.ObjectId;
  listingId?: mongoose.Types.ObjectId;
  cropName: string;
  grade?: string;
  quantity: number;
  unit: string;
  agreedPrice: number;
  totalAmount: number;
  buyerName?: string;
  soldAt: Date;
}

/**
 * One document per farmer per day (dateKey = 'YYYY-MM-DD' in IST). Holds every
 * selling confirmed that day and the running totals (sellings count + total payment).
 * Built automatically as sales are confirmed — see statement.service.ts.
 */
export interface IDailyStatement extends Document {
  sellerId: mongoose.Types.ObjectId;
  dateKey: string;
  date: Date;
  entries: IStatementEntry[];
  totalSales: number;
  totalQuantity: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const StatementEntrySchema = new Schema<IStatementEntry>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
    cropName: { type: String, required: true },
    grade: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    agreedPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    buyerName: { type: String },
    soldAt: { type: Date, required: true },
  },
  { _id: false },
);

const DailyStatementSchema = new Schema<IDailyStatement>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateKey: { type: String, required: true },
    date: { type: Date, required: true },
    entries: { type: [StatementEntrySchema], default: [] },
    totalSales: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One statement per farmer per day.
DailyStatementSchema.index({ sellerId: 1, dateKey: 1 }, { unique: true });

export const DailyStatement = mongoose.model<IDailyStatement>('DailyStatement', DailyStatementSchema);
