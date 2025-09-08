'use server';

import { NextRequest, NextResponse } from "next/server";
import DB from "@app/_database/db";
import HandleResponse from "@app/_helpers/Handler";
import Currency from "@app/_model/currecncy.modal";

// ✅ Connect DB before every request
async function connectDB() {
  try {
    await DB();
  } catch (err) {
    console.error("DB connection failed:", err);
  }
}

// ✅ POST: Add new currency
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { userId, currencyCode, currencyName, currencySymbol } = body;
    console.log("api call", body);

    if (!currencyCode || !currencyName || !currencySymbol) {
      return NextResponse.json(
        HandleResponse({
          type: "BAD_REQUEST",
          message: "Missing required fields",
        }),
        { status: 400 }
      );
    }

    // ✅ If currency already exists for user, update it
    const updatedCurrency = await Currency.findOneAndUpdate(
      { userId }, // condition
      { currencyCode, currencyName, currencySymbol }, // update fields
      { new: true, upsert: true } // upsert = create if not found
    );

    return NextResponse.json(
      HandleResponse({
        type: "SUCCESS",
        message: updatedCurrency.wasNew
          ? "Currency created successfully"
          : "Currency updated successfully",
        data: updatedCurrency,
      }),
      { status: updatedCurrency.wasNew ? 201 : 200 }
    );
  } catch (error: any) {
    console.error("POST /currency error:", error);
    return NextResponse.json(
      HandleResponse({
        type: "ERROR",
        message: "Error saving currency",
      }),
      { status: 500 }
    );
  }
}


// ✅ GET: Fetch all currencies (optionally filter by userId)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
console.log("api call userId",userId);
    let query: any = {};
    if (userId) query.userId = userId;

    const currencies = await Currency.find(query).sort({ createdAt: -1 });

    return NextResponse.json(
      {message:"Currencies fetched successfully",currencies},
      { status: 200 }

    );
  } catch (error: any) {
    console.error("GET /currency error:", error);
    return NextResponse.json(
      HandleResponse({type:"ERROR", message:"Error fetching currencies"}),
      { status: 500 }
    );
  }
}
