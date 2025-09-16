import mongoose, { Model, model, models, Schema } from "mongoose";
import Users from "./user.model";

// Base schema for common fields
const BaseExpenseSchema = new Schema(
  {
    siteName: { type: String },
    todayWork: { type: String },
    location: { type: Object, required: [true, "Location is required!"] },
    amount: { type: Number, required: [true, "Amount is required!"] },
    description: { type: String },
    remarks: { type: String },
    adminMessage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    serviceProvider: { type: String, default: "" },
    locationFiles: { type: [String], default: [] },
    paymentFiles: { type: [String], default: [] },
    invoiceFiles: { type: [String], default: [] },
  },
  { timestamps: true }
);
// recharge Schema
const RechargeSchema = new Schema({
  ...BaseExpenseSchema.obj,
  rechargeType: { type: String },
  phoneNumber: { type: String },
  planType: { type: String },
  billDateFrom: { type: Date },
  billDateTo: { type: Date },
});
// Conveyance schema
const ConveyanceSchema = new Schema({
  ...BaseExpenseSchema.obj, // Spread base schema fields
  modeOfTravel: {
    type: String,

  },
  startingPlace: {
    type: String,

  },
  endingPlace: { type: String },
  driverNumber: { type: Number },
});

// Purchase schema
const PurchaseSchema = new Schema({
  ...BaseExpenseSchema.obj,
  itemName: { type: String},
  quantity: { type: Number },
  shopName: { type: String },
  shopNumber: { type: Number },
});

// Food schema
const FoodSchema = new Schema({
  ...BaseExpenseSchema.obj,
  meal: { type: String },
  numberOfPersons: {
    type: Number,
  },
  restaurantName: {
    type: String,
  },
  restaurantNumber: { type: Number },
});
// tea schema
const TeaSchema = new Schema({
  ...BaseExpenseSchema.obj,
  meal: { type: String },
  numberOfPersons: {
    type: Number,
  },
});
// hotel schema
const HotelSchema = new Schema({
  ...BaseExpenseSchema.obj,
  hotelName: { type: String},
  hotelNumber: { type: Number },
  documentNo: { type: String },
  numberOfPersons: {
    type: Number,
  },
  rent: { type: Number },
  days: { type: Number},
  startingDate: { type: Date},
  endingDate: { type: Date },
});
// labour schema
const LabourSchema = new Schema({
  ...BaseExpenseSchema.obj,
  purposeOfLabour: {
    type: String,
  },
  documentNo: { type: String },
  masterLabourName: {
    type: String,
  },
  masterLabourNumber: { type: Number },
  numberOfLabours: {
    type: Number,
  },
});
// courier schema
const CourierSchema = new Schema({
  ...BaseExpenseSchema.obj,
  customerName: {
    type: String,
  },
  deliveryMode: {
    type: String,
  },
  packetType: { type: String},
  startingPlace: {
    type: String,
  },
  endingPlace: { type: String},
});
// loading schema
const LoadingSchema = new Schema({
  ...BaseExpenseSchema.obj,
  workType: { type: String},
  material: { type: String},
  documentNo: { type: String },
  masterLabourName: {
    type: String,
  },
  loadingDetails: [
    {
      type: { type: String },
      quantity: { type: Number },
      rate: { type: Number },
    },
  ],
});

// porter schema
const PorterSchema = new Schema({
  ...BaseExpenseSchema.obj,
  customerName: {
    type: String,
  },
  purpose: { type: String },
  documentNo: { type: String },
  documentType: {
    type: String,
  },
  vehicleType: {
    type: String,
  },
  startingPlace: {
    type: String,
  },
  distance: { type: String },
  endingPlace: { type: String },
  driverNumber: { type: Number },
});
// rider schema
const RiderSchema = new Schema({
  ...BaseExpenseSchema.obj,
  customerName: {
    type: String,
  },
  deliveryMode: {
    type: String,
  },
  startingPlace: {
    type: String,
  },
  endingPlace: { type: String },
});
// maintenance schema
const MaintenanceSchema = new Schema({
  ...BaseExpenseSchema.obj,
  jobName: { type: String },
  person: { type: String },
  numberOfPerson: {
    type: Number,
  },
  nameOfItem: { type: String },
  totalLabour: { type: Number },
  documentNo: { type: String },
});
// other schema
const OtherSchema = new Schema({
  ...BaseExpenseSchema.obj,
  nameOfPerson: { type: String },
  contactNumber: { type: Number },
  documentNo: { type: String },
});

// Define the OfficeExpense schema
const OfficeExpenseSchema = new Schema(
  {
    date: { type: String},
    conveyance: { type: [ConveyanceSchema], default: [] },
    purchase: { type: [PurchaseSchema], default: [] },
    food: { type: [FoodSchema], default: [] },
    tea: { type: [TeaSchema], default: [] },
    hotel: { type: [HotelSchema], default: [] },
    labour: { type: [LabourSchema], default: [] },
    courier: { type: [CourierSchema], default: [] },
    loading: { type: [LoadingSchema], default: [] },
    porter: { type: [PorterSchema], default: [] },
    recharge: { type: [RechargeSchema], default: [] },
    cartage: { type: [PorterSchema], default: [] },
    rider: { type: [RiderSchema], default: [] },
    dailyWages: { type: [LabourSchema], default: [] },
    transport: { type: [PorterSchema], default: [] },
    maintenance: { type: [MaintenanceSchema], default: [] },
    other: { type: [OtherSchema], default: [] },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: [true, "Created by user is required!"],
    },
  },
  { timestamps: true }
);

// Create the Expense model
const OfficeExpense =
  models.OfficeExpense || model("OfficeExpense", OfficeExpenseSchema);

export default OfficeExpense;
