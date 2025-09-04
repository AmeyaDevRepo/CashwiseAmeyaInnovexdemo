"use server";
import DB from "@app/_database/db";
import OfficeExpense from "@app/_model/office.modal";
import TravelExpense from "@app/_model/travel.modal";
import ToPayExpense from "@app/_model/toPay.modal";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import Users from "@app/_model/user.model";
import PreviousMap_ from "@node_modules/postcss/lib/previous-map";

(async function initializeDB() {
  await DB();
})();

export async function GET(req: NextRequest) {
  try {
    const userHeader = req.headers.get("user");
    if (!userHeader) {
      return NextResponse.json(
        { type: "UNAUTHORIZED", message: "No user header found" },
        { status: 401 }
      );
    }

    const middlewareUser = JSON.parse(userHeader);
    if (
      middlewareUser?.role !== "admin" &&
      middlewareUser?.role !== "manager"
    ) {
      return NextResponse.json(
        { type: "UNAUTHORIZED", message: "Access denied" },
        { status: 401 }
      );
    }

    const searchUrl = new URL(req.url);
    const fromDateParam = searchUrl.searchParams.get("fromDate");
    const toDateParam = searchUrl.searchParams.get("toDate");
    const rawUserParams = searchUrl.searchParams.getAll("user");
    const statusParamsRaw = searchUrl.searchParams.get("status") || "";
    const formTypeParamsRaw = searchUrl.searchParams.getAll("formType").join(",") || "";
    const formTypeParamsArray = formTypeParamsRaw
      .split(",")
      .map((param) => param.trim())
      .filter((param) => param !== "");
    const statusParams = statusParamsRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const expenseType = searchUrl.searchParams.get("expenseType") || "all";
    const startDate = fromDateParam
      ? DateTime.fromISO(fromDateParam)
          .setZone("Asia/Kolkata")
          .toFormat("yyyy-MM-dd")
      : DateTime.now().minus({ weeks: 1 }).toFormat("yyyy-MM-dd");

    const endDate = toDateParam
      ? DateTime.fromISO(toDateParam)
          .setZone("Asia/Kolkata")
          .toFormat("yyyy-MM-dd")
      : DateTime.now().toFormat("yyyy-MM-dd");

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Optimize user ID fetching
    const userParams = rawUserParams
      .flatMap((u) => u.split(","))
      .map((id) => id.trim())
      .filter((id) => id);
    const filterUserIds =
      userParams.length > 0
        ? userParams
        : (await Users.find({}, { _id: 1 }).lean()).map((u) =>
            u._id.toString()
          );

    // Fetch only required users
    const usersData = await Users.find({ _id: { $in: filterUserIds } }).lean();
    if (!usersData) {
      return NextResponse.json(
        {
          type: "BAD_REQUEST",
          message: "Something went wrong, Please check your network!",
        },
        { status: 400 }
      );
    }

    const usersMap = new Map();
    const usersResult = usersData?.map((user: any) => {
      let totalCredit = 0;
      let totalDebit = 0;
      // Sum all credit money
      (user?.credit || []).forEach((entry: any) => {
        (entry?.transactionDetails || []).forEach((t: any) => {
          totalCredit += t.money;
        });
      });

      // Sum all debit money
      (user?.debit || []).forEach((entry: any) => {
        (entry?.transactionDetails || []).forEach((t: any) => {
          totalDebit += t.money;
        });
      });

      const creditDetails = (user?.credit || [])
        .map((entry: any) => {
          const filtered = entry?.transactionDetails?.filter((t: any) => {
            const date = new Date(t?.createdAt);
            date.setUTCHours(0, 0, 0, 0);
            return date >= start && date <= end;
          });
          return filtered.length > 0
            ? { ...entry, transactionDetails: filtered }
            : null;
        })
        .filter(Boolean);

      const debitDetails = (user?.debit || [])
        .map((entry: any) => {
          const filtered = entry?.transactionDetails?.filter((t: any) => {
            const date = new Date(t?.createdAt);
            date.setUTCHours(0, 0, 0, 0);
            const reason = (t?.reason || "")?.toLowerCase();
            return date >= start && date <= end && !reason?.includes("expense");
          });
          return filtered?.length > 0
            ? { ...entry, transactionDetails: filtered }
            : null;
        })
        .filter(Boolean);
      const u = {
        _id: user._id,
        name: user.name,
        phone: user?.phone,
        role: user.role,
        email: user.email || "",
        creditDetails,
        debitDetails,
        balance: Math.round(totalCredit - totalDebit),
        officeExpenseDetails: [],
        travelExpenseDetails: [],
        toPayExpenseDetails: [],
      };
      usersMap?.set(user?._id?.toString(), u);
      return u;
    });

    const query: any = {
      createdBy: { $in: filterUserIds },
      date: { $gte: startDate, $lte: endDate },
    };
    //filter for expenseType
if (formTypeParamsArray.length > 0) {
  query.$or = formTypeParamsArray.map((formType: string) => ({
    [formType]: { $exists: true, $ne: [] },
  }));
}

let projection: any = { createdBy: 1, date: 1, createdAt: 1, updatedAt: 1 };

if (formTypeParamsArray.length > 0) {
  formTypeParamsArray.forEach((field) => {
    projection[field] = 1;
  });
} else {
  // If array empty, include all known schema fields 
  const allExpenseFields = [
    "conveyance", "cartage", "courier", "dailyWages", "food",
    "hotel", "labour", "loading", "maintenance", "other",
    "porter", "purchase", "rider", "tea", "transport"
  ];

  allExpenseFields.forEach((field) => {
    projection[field] = 1;
  });
}
    const [officeExpenseData, travelExpenseData, toPayExpenseData] =
      await Promise.all([
        expenseType === "all" || expenseType === "office"
          ? OfficeExpense.find(query,projection).lean().populate({
              path: "createdBy",
              model: Users,
              select: "_id name phone role",
            })
          : [],
        expenseType === "all" || expenseType === "travel"
          ? TravelExpense.find(query,projection).lean().populate({
              path: "createdBy",
              model: Users,
              select: "_id name phone role",
            })
          : [],
        expenseType === "all" || expenseType === "toPay"
          ? ToPayExpense.find(query,projection).lean().populate({
              path: "createdBy",
              model: Users,
              select: "_id name phone role",
            })
          : [],
      ]);

    const groupByUser = (
      data: any[],
      key: keyof (typeof usersResult)[0],
      type: string
    ) => {
      data.forEach((item) => {
        const user = usersMap.get(item?.createdBy?._id.toString());
        if (!user) return;

        // If status filter is applied
        if (statusParams.length > 0) {
          const newItem = { ...item };
          const expenseCategories = Object.keys(item).filter(
            (k) => Array.isArray(item[k]) && item[k].some((e: any) => e?.status)
          );

          for (const category of expenseCategories) {
            newItem[category] = item[category].filter((entry: any) =>
              statusParams.includes(entry.status)
            );
          }

          const hasAtLeastOne = expenseCategories.some(
            (k) => newItem[k] && newItem[k].length > 0
          );

          if (hasAtLeastOne) user[type].push(newItem);
        } else {
          user[type].push(item);
        }
      });
    };

    groupByUser(
      officeExpenseData,
      "officeExpenseDetails",
      "officeExpenseDetails"
    );
    groupByUser(
      travelExpenseData,
      "travelExpenseDetails",
      "travelExpenseDetails"
    );
    groupByUser(toPayExpenseData, "toPayExpenseDetails", "toPayExpenseDetails");

    return NextResponse.json(
      {
        type: "SUCCESS",
        message: "Data fetched successfully",
        result: usersResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { type: "ERROR", message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
