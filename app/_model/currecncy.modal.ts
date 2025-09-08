import mongoose, { Schema, model, models, Model, mongo } from "mongoose";

const currencySchema = new Schema(
  {
    userId:{type:mongoose.Types.ObjectId,ref:'User'},
    currencyCode: { type: String, required: true },
    currencyName: { type: String, required: true },
    currencySymbol: { type: String, required: true },
  },
  { timestamps: true }
);

const Currency =
  models.Currency || model("Currency", currencySchema);

export default Currency;
