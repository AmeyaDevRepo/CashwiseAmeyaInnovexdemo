export const maxDuration = 60;
import DB from "@app/_database/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { toast } from "react-toastify";
import hash from "bcrypt";
import Users from "@app/_model/user.model";
import ImageKit from "imagekit";
import axios from "axios";
import { messageAlert } from "@app/_helpers/messageAlert";
import { creditMessageAlert } from "@app/_helpers/credit.mesageAlert";

// Initialize database connection
(async function initializeDB() {
  await DB();
})();

// image upload function
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
});

const uploadToImageKit = async (file: any, folder: string) => {
  try {
    const response = await imagekit.upload({
      file,
      fileName: `${folder}-${Date.now()}`,
      folder: `/api/expenses/${folder}`,
    });
    return response.url;
  } catch (err: any) {
    console.error("ImageKit upload error:", err.message || err);
    throw new Error("Failed to upload image to ImageKit");
  }
};

const mapExpenses = async (file: any, folder: string) => {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToImageKit(fileBuffer, folder);
  return url;
};

export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const toName = formData.get("toName") as string;
    const fromName = formData.get("fromName") as string;
    const toEmail = (formData.get("toEmail") as string) || "";
    const fromEmail = (formData.get("fromEmail") as string) || "";
    const toPhone = formData.get("toPhone") as string | null;
    const fromPhone = formData.get("fromPhone") as string | null;
    const amount = parseFloat(formData.get("amount") as string);
    const reason = formData.get("reason") as string;
    const remarks = formData.get("remarks") as string;
    const files = formData.getAll("files"); // Get all files
    const filesUrl: string[] = [];

    // Upload files if any
    if (files.length > 0) {
      for (const file of files) {
        const url = await mapExpenses(file, "transaction");
        filesUrl.push(url);
      }
    }

    const creditUser: any = await Users.findOne({ phone: toPhone });
    const debitUser: any = await Users.findOne({ phone: fromPhone });

    if (!creditUser || !debitUser) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "User not found!" },
        { status: 404 }
      );
    }

    const transactionDetails = {
      money: amount,
      reason,
      remarks,
      imageUrl: filesUrl,
    };
    let var1 = `₹${amount} by ${fromName}`;
    let var2 = `${toName}'s`;
    let var3 = creditUser?._id;
    if (toPhone === fromPhone) {
      const existingCredit = creditUser.credit.find(
        (entry: any) => entry.phone === fromPhone
      );
      if (toPhone) {
        await creditMessageAlert(
          var1,
          var2,
          var3,
          parseInt(toPhone.toString())
        );
      }
      if (existingCredit) {
        existingCredit.transactionDetails.push(transactionDetails);
      } else {
        creditUser.credit.push({
          name: fromName,
          email: fromEmail,
          phone: fromPhone,
          transactionDetails: [transactionDetails],
        });
      }
      await creditUser.save();

      if (toPhone) {
        await creditMessageAlert(
          var1,
          var2,
          var3,
          parseInt(toPhone.toString())
        );
      }
    } else {
      // Credit user (Receiver)
      const existingCredit = creditUser.credit.find(
        (entry: any) => entry.phone === fromPhone
      );
      if (existingCredit) {
        existingCredit.transactionDetails.push(transactionDetails);
        await creditUser.save();
        // await messageAlert(amount, fromName, fromPhone ? parseInt(fromPhone) : null, toPhone ? parseInt(toPhone) : null)
        if (toPhone) {
          await creditMessageAlert(
            var1,
            var2,
            var3,
            parseInt(toPhone.toString())
          );
        }
      } else {
        creditUser.credit.push({
          name: fromName,
          email: fromEmail,
          phone: fromPhone,
          transactionDetails: [transactionDetails],
        });
        await creditUser.save();
        //    await messageAlert(amount, fromName, fromPhone ? parseInt(fromPhone) : null, toPhone ? parseInt(toPhone) : null)
        if (toPhone) {
          await creditMessageAlert(
            var1,
            var2,
            var3,
            parseInt(toPhone.toString())
          );
        }
      }

      // Debit user (Sender)
      const existingDebit = debitUser.debit.find(
        (entry: any) => entry.phone === toPhone
      );
      if (existingDebit) {
        existingDebit.transactionDetails.push(transactionDetails);
        await debitUser.save();
        // await messageAlert(amount, toName, fromPhone ? parseInt(fromPhone) : null, toPhone ? parseInt(toPhone) : null)
      } else {
        debitUser.debit.push({
          name: toName,
          email: toEmail,
          phone: toPhone,
          transactionDetails: [transactionDetails],
        });
        await debitUser.save();
        //    await messageAlert(amount, toName, fromPhone ? parseInt(fromPhone) : null, toPhone ? parseInt(toPhone) : null)
      }
    }

    return NextResponse.json(
      { type: "SUCCESS", message: "Transaction completed successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { type: "BAD_REQUEST", message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "";
  const name = searchParams.get("name") || "";
  try {
    const matchCriteria: any = {};
    if (type) {
      matchCriteria.type = type;
    }
    if (name) {
      matchCriteria.name = { $regex: name.trim(), $options: "i" };
    }

    const result = await Users.aggregate([{ $match: matchCriteria }]);

    if (!result) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "No user found!" },
        { status: 404 }
      );
    }

    return NextResponse.json({ type: "SUCCESS", result }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { type: "BAD_REQUEST", message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
