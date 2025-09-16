import DB from "@app/_database/db";
import { NextRequest, NextResponse } from "next/server";
import Users from "@app/_model/user.model";
import OfficeExpense from "@app/_model/office.modal";
import mongoose from "mongoose";
import { DateTime } from "luxon";

(async function initializeDB() {
  await DB();
})();

export async function POST(req: NextRequest) {
  const userHeader = req.headers.get("user");
  const authUser: any = userHeader ? JSON.parse(userHeader) : null;
  if (authUser?.role !== "admin" && authUser?.role !== "manager") {
    return NextResponse.json(
      {
        type: "BAD_REQUEST",
        message: "You are not authorized to create user",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    let usersId: string[] = body.users || [];
    if (usersId.length === 0) {
      usersId = await Users.distinct("_id");
    }

    const startDate = body.fromDate
      ? DateTime.fromISO(body.fromDate).startOf("day").toJSDate()
      : new Date(0);

    const endDate = body.toDate
      ? DateTime.fromISO(body.toDate).endOf("day").toJSDate()
      : new Date();

    let officeExpenseReports: any[] = [];
    let personalExpenseReports: any[] = [];

    if (body.fields !== "personal") {
      const result = await OfficeExpense.aggregate([
        {
          $match: {
            createdBy: {
              $in: usersId.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: "$date",
                format: "%Y-%m-%d",
              },
            },
          },
        },
        {
          $match: {
            parsedDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $project: {
            createdBy: 1,
            createdAt: 1,
            cartage: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$cartage", []] } }, 0] },
                "$cartage",
                "$$REMOVE",
              ],
            },
            conveyance: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$conveyance", []] } }, 0] },
                "$conveyance",
                "$$REMOVE",
              ],
            },
            courier: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$courier", []] } }, 0] },
                "$courier",
                "$$REMOVE",
              ],
            },
            dailyWages: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$dailyWages", []] } }, 0] },
                "$dailyWages",
                "$$REMOVE",
              ],
            },
            food: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$food", []] } }, 0] },
                "$food",
                "$$REMOVE",
              ],
            },
            hotel: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$hotel", []] } }, 0] },
                "$hotel",
                "$$REMOVE",
              ],
            },
            kitchen: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$kitchen", []] } }, 0] },
                "$kitchen",
                "$$REMOVE",
              ],
            },
            labour: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$labour", []] } }, 0] },
                "$labour",
                "$$REMOVE",
              ],
            },
            loading: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$loading", []] } }, 0] },
                "$loading",
                "$$REMOVE",
              ],
            },
            maintenance: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$maintenance", []] } }, 0] },
                "$maintenance",
                "$$REMOVE",
              ],
            },
            marketing: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$marketing", []] } }, 0] },
                "$marketing",
                "$$REMOVE",
              ],
            },
            medical: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$medical", []] } }, 0] },
                "$medical",
                "$$REMOVE",
              ],
            },
            other: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$other", []] } }, 0] },
                "$other",
                "$$REMOVE",
              ],
            },
            policy: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$policy", []] } }, 0] },
                "$policy",
                "$$REMOVE",
              ],
            },
            porter: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$porter", []] } }, 0] },
                "$porter",
                "$$REMOVE",
              ],
            },
            purchase: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$purchase", []] } }, 0] },
                "$purchase",
                "$$REMOVE",
              ],
            },
            recharge: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$recharge", []] } }, 0] },
                "$recharge",
                "$$REMOVE",
              ],
            },
            rider: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$rider", []] } }, 0] },
                "$rider",
                "$$REMOVE",
              ],
            },
            tea: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$tea", []] } }, 0] },
                "$tea",
                "$$REMOVE",
              ],
            },
            training: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$training", []] } }, 0] },
                "$training",
                "$$REMOVE",
              ],
            },
            transport: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$transport", []] } }, 0] },
                "$transport",
                "$$REMOVE",
              ],
            },
            vehicle: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$vehicle", []] } }, 0] },
                "$vehicle",
                "$$REMOVE",
              ],
            },
            water: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$water", []] } }, 0] },
                "$water",
                "$$REMOVE",
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 0,
                  userId: "$_id",
                  name: 1,
                  phone: 1,
                  type: 1,
                },
              },
            ],
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $group: {
            _id: "$createdBy",
            userDetails: { $first: "$userDetails" },
            expenses: {
              $push: {
                createdAt: "$createdAt",
                expenseType: "Office",
                cartage: "$cartage",
                conveyance: "$conveyance",
                courier: "$courier",
                dailyWages: "$dailyWages",
                food: "$food",
                hotel: "$hotel",
                kitchen: "$kitchen",
                labour: "$labour",
                loading: "$loading",
                maintenance: "$maintenance",
                marketing: "$marketing",
                medical: "$medical",
                other: "$other",
                policy: "$policy",
                porter: "$porter",
                purchase: "$purchase",
                recharge: "$recharge",
                rider: "$rider",
                tea: "$tea",
                training: "$training",
                transport: "$transport",
                vehicle: "$vehicle",
                water: "$water",
              },
            },
          },
        },
      ]);

      if (Array.isArray(result)) {
        officeExpenseReports = result;
      }
    }

    const mergedMap = new Map();
    [...officeExpenseReports, ...personalExpenseReports].forEach((report) => {
      const userId = report.userDetails.userId.toString();
      if (!mergedMap.has(userId)) {
        mergedMap.set(userId, {
          userDetails: report.userDetails,
          expenses: [...report.expenses],
        });
      } else {
        mergedMap.get(userId).expenses.push(...report.expenses);
      }
    });

    const reportData = Array.from(mergedMap.values()).map((entry) => {
      entry.expenses.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return entry;
    });

    return NextResponse.json(
      {
        type: "SUCCESS",
        message: "User expense reports fetched successfully.",
        data: reportData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/reports/userExpenseReports:", error);
    return NextResponse.json(
      {
        type: "ERROR",
        message: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
