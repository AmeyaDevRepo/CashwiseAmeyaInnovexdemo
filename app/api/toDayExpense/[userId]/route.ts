import DB from "@app/_database/db";
import { NextRequest, NextResponse } from "next/server";
import ToPayExpense from "@app/_model/toPay.modal";
import mongoose from "mongoose";
import { DateTime } from 'luxon';

// Initialize database connection
(async function initializeDB() {
    await DB();
  })();

//   today expese get function
  export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const userId = params.userId;
        if (!userId) {
            return NextResponse.json({ message: 'Please log in to submit the form!' }, { status: 401 });
        }
        const today = DateTime.now().setZone('Asia/Kolkata').startOf('day').toISODate();
        
        const toPayExpense = await ToPayExpense.find(
    {
        date:today,
        createdBy: new mongoose.Types.ObjectId(userId),
        
})
return NextResponse.json({
    type: "SUCCESS",
    message: 'To day expense',
    toPayExpense,today
}, { status: 200 });
    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({
            type: "ERROR",
            message: error.message ||'Something went wrong!',
        }, { status: 500 });
    }
    
}