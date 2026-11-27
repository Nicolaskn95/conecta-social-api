import { Schema } from 'mongoose';

export const ItemSpecificationsSchema = new Schema(
  {
    seat_width_cm: {
      type: Number,
      validate: (value: number) => Number.isFinite(value) && value > 0,
    },
    shoe_size_br: {
      type: Number,
      validate: (value: number) => Number.isInteger(value) && value > 0,
    },
  },
  { _id: false, minimize: false, strict: 'throw' }
);
