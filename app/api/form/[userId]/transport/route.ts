"use server";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb"; // or from 'mongoose' if you're using Mongoose
import DB from "@app/_database/db";
import OfficeExpense from "@app/_model/office.modal";
import ImageKit from "imagekit";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import TravelExpense from "@app/_model/travel.modal";
import ToPayExpense from "@app/_model/toPay.modal";
import { expenseMessageAlert } from "@app/_helpers/expense.messageAlert";
import Users from "@app/_model/user.model";

// Initialize database connection
(async function initializeDB() {
  await DB();
})();

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await req.formData();
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Please log in to submit the form!" },
        { status: 401 }
      );
    }
    if (!body) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "No data available!" },
        { status: 400 }
      );
    }
    const amount = parseFloat(body.get("amount") as string) || 0;
    const today = DateTime.now()
      .setZone("Asia/Kolkata")
      .startOf("day")
      .toISODate();
 const expenseDateValue = body.get("expenseDate") as string | null;

    if (!expenseDateValue) {
      throw new Error("Expense date is required");
    }

    const jsDate = new Date(expenseDateValue);
    const expenseDate = DateTime.fromJSDate(jsDate)
      .setZone("Asia/Kolkata")
      .startOf("day")
      .toISODate();
    if (!expenseDate) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "Invalid date format!" },
        { status: 400 }
      );
    }
    const transportData = {
      siteName: body.get("siteName"),
      todayWork: body.get("todayWork"),
      location: body.get("location"),
      serviceProvider: body.get("serviceProvider") || "",
      amount,
      customerName: body.get("customerName"),
      purpose: body.get("purpose"),
      documentType: body.get("documentType"),
      vehicleType: body.get("vehicleType"),
      startingPlace: body.get("startingPlace"),
      endingPlace: body.get("endingPlace"),
      distance: body.get("distance"),
      driverNumber: body.get("driverNumber"),
      description: body.get("description"),
      remarks: body.get("remarks"),
      documentNO: body.get("documentNO"),
      locationFiles: body.getAll("Location") || [],
      paymentFiles: body.getAll("Payment") || [],
      invoiceFiles: body.getAll("Invoice") || [],
    };
    const schemaName = body.get("schema") as string;
    let result: any;
    if (schemaName === "/officeExpense") {
      result = await OfficeExpense.findOneAndUpdate(
        {
          createdBy: new mongoose.Types.ObjectId(userId),
          date: expenseDate,
        },
        { $push: { transport: transportData } },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    } else if (schemaName === "/travelExpense") {
      result = await TravelExpense.findOneAndUpdate(
        {
          createdBy: new mongoose.Types.ObjectId(userId),
          date: expenseDate,
        },
        { $push: { transport: transportData } },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    } else if (schemaName === "/toPayExpense") {
      result = await ToPayExpense.findOneAndUpdate(
        {
          createdBy: new mongoose.Types.ObjectId(userId),
          date: expenseDate,
        },
        { $push: { transport: transportData } },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    }
    // expense message alert
    const user: any = await Users.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "User not found,Login account!" },
        { status: 404 }
      );
    }
    if (!user.expense.includes(result._id)) {
      user.expense.push(result._id);
      await user.save();
    }
    const transactionDetails = {
      money: amount,
      reason: "Transport Expense",
      imageUrl: [],
    };

    const existingDebit = user?.debit.find(
      (entry: any) => entry.phone === user?.phone
    );
    if (existingDebit) {
      existingDebit.transactionDetails.push(transactionDetails);
    } else {
      user.debit.push({
        name: user?.name,
        phone: user?.phone,
        transactionDetails: [transactionDetails],
      });
    }
    await user.save();

    return NextResponse.json(
      { message: "Expense saved successfully", data: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating expense:", error.message);
    return NextResponse.json(
      { type: "ERROR", message: error.message || "Something went wrong!" },
      { status: 500 }
    );
  }
}
