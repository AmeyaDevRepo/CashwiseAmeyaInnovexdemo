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
    const expenseDateValue = body.get("expenseDate") as string | null;

    if (!expenseDateValue) {
      throw new Error("Expense date is required");
    }

    const GstData: any =body.get("GstData");
   const parseGstData=JSON.parse(GstData);
   
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
    const rechargeData = {
      siteName: body.get("siteName"),
      todayWork: body.get("todayWork"),
      location: body.get("location"),
      amount,
      bankName: body.get("bankName"),
      paymentMode: body.get("paymentMode"),
      phoneNumber: body.get("phoneNumber"),
      planType: body.get("planType"),
      billDateFrom: body.get("billDateFrom") ? new Date(body.get("billDateFrom") as string) : null,
      billDateTo: body.get("billDateTo") ? new Date(body.get("billDateTo") as string) : null,
      itemName: body.get("rechargeType"),
      description: body.get("description"),
      remarks: body.get("remarks"),
      locationFiles: body.getAll("Location") || [],
      paymentFiles: body.getAll("Payment") || [],
      invoiceFiles: body.getAll("Invoice") || [],
       gstNo: parseGstData?.gstNo,
      taxableAmount: parseGstData?.amount,
      gstRate:  parseGstData?.rate,
      gstAmount: parseGstData?.gstAmount,
    };
    const schemaName = body.get("schema") as string;
    let result: any;
    if (schemaName === "/officeExpense") {
      result = await OfficeExpense.findOneAndUpdate(
        {
          createdBy: new mongoose.Types.ObjectId(userId),
          date: expenseDate,
        },
        { $push: { recharge: rechargeData } },
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
        { $push: { recharge: rechargeData } },
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
    // await expenseMessageAlert(user.name,'Recharge',amount)
    const transactionDetails = {
      money: amount,
      reason: "Recharge Expense",
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
      { type: "ERROR", message: "Something went wrong!" },
      { status: 500 }
    );
  }
}