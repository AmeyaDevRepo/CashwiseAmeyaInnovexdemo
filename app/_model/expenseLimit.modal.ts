// models/ExpenseLimit.js
import mongoose, { Schema, model, models } from "mongoose";

const ExpenseLimitSchema = new Schema(
  {
    name:{type:String},
    conveyance: { type: Number, default: 300 },
    purchase: { type: Number, default: 2000 },
    food: { type: Number, default: 5000 },
    tea: { type: Number, default: 100 },
    hotel: { type: Number, default: 5000 },
    labour: { type: Number, default: 1000 },
    courier: { type: Number, default: 200 },
    loading: { type: Number, default: 2000 },
    porter: { type: Number, default: 800 },
    cartage: { type: Number, default: 600 },
    rider: { type: Number, default: 400 },
    daily_wages: { type: Number, default: 500 },
    transport: { type: Number, default: 1000 },
    maintenance: { type: Number, default: 500 },
    contractor: { type: Number, default: 4000 },
    other: { type: Number, default: 500 },
    max_limit: { type: Number, default: 6000 },
    status: { type: String,default:"Active"},
    approvalRequest: { type: Date },
    approved: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "Users"},
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
  },
  { timestamps: true }
);

const ExpenseLimit = models.ExpenseLimit || model("ExpenseLimit", ExpenseLimitSchema);

export default ExpenseLimit;
