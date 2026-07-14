import mongoose, { Schema } from 'mongoose';

/**
 * Atomic named sequence counter. Used to generate gap-free, collision-free
 * incrementing numbers (e.g. farmer usernames) under concurrency.
 */
export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);
