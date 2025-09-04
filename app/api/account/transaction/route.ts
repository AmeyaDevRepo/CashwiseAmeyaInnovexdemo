// file: app/api/filterTransactions/route.ts
import DB from "@app/_database/db";
import { NextRequest, NextResponse } from "next/server";
import Users from "@app/_model/user.model";
import ToPayExpense from "@app/_model/toPay.modal";
import TravelExpense from "@app/_model/travel.modal";
import OfficeExpense from "@app/_model/office.modal";
import mongoose from "mongoose";
import { DateTime } from "luxon";

(async function initializeDB() {
  await DB();
})();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("userId") || "";
  const name = searchParams.get("name")?.toLowerCase() || "";
  const minAmount = parseFloat(searchParams.get("minAmount") || "0");
  const maxAmount = parseFloat(searchParams.get("maxAmount") || "0");
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const reason = searchParams.get("reason")?.toLowerCase() || "";
  const limit = parseInt(searchParams.get("limit") || "0");
  const transactionType = searchParams.get("transactionType") || "all";

  try {
    const startingDate = fromDate
      ? DateTime.fromISO(fromDate).setZone("Asia/Kolkata").startOf("day")
      : null;
    const endingDate = toDate
      ? DateTime.fromISO(toDate).setZone("Asia/Kolkata").endOf("day")
      : null;

    const account: any = await Users.findById(
      new mongoose.Types.ObjectId(userId)
    ).lean();
    if (!account) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "No user found!" },
        { status: 404 }
      );
    }

    const filterTransactionGroup = (group: any[]) =>
      group
        .map((person: any) => {
          if (name && !person.name.toLowerCase().includes(name)) return null;

          const filteredTransactions = person.transactionDetails.filter(
            (t: any) => {
              const tDate = DateTime.fromJSDate(
                new Date(t.updatedAt || t.createdAt)
              ).setZone("Asia/Kolkata");
              const amount = t.money;

              const dateValid =
                (!startingDate || tDate >= startingDate) &&
                (!endingDate || tDate <= endingDate);

              const amountValid =
                (minAmount === 0 && maxAmount === 0) ||
                (minAmount > 0 && (!maxAmount || amount >= minAmount)) ||
                (maxAmount > 0 && (!minAmount || amount <= maxAmount)) ||
                (minAmount &&
                  maxAmount &&
                  amount >= minAmount &&
                  amount <= maxAmount);

              const reasonValid =
                !reason || t.reason?.toLowerCase().includes(reason);

              return dateValid && amountValid && reasonValid;
            }
          );

          return filteredTransactions.length > 0
            ? {
                ...person,
                transactionDetails: filteredTransactions.sort(
                  (a: any, b: any) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
                ),
              }
            : null;
        })
        .filter(Boolean)
        .slice(0, limit > 0 ? limit : undefined);

    if (transactionType === "credit") {
      account.credit = filterTransactionGroup(account.credit || []);
      account.debit = [];
    } else if (transactionType === "debit") {
      account.debit = filterTransactionGroup(account.debit || []);
      account.credit = [];
    } else if (transactionType === "all") {
      account.credit = filterTransactionGroup(account.credit || []);
      account.debit = filterTransactionGroup(account.debit || []);
    } else {
      account.credit = [];
      account.debit = [];
    }

    const buildExpenseMatch = () => {
      const match: any = { createdBy: new mongoose.Types.ObjectId(userId) };
      if (startingDate || endingDate) {
        match.date = {};
        if (startingDate) match.date.$gte = startingDate.toFormat("yyyy-MM-dd");
        if (endingDate) match.date.$lte = endingDate.toFormat("yyyy-MM-dd");
      }
      return match;
    };

    const applyExpenseFilters = (data: any[]) => {
      return data
        .map((item: any) => {
          const filteredItem = { ...item };
          let hasMatchingData = false;
          Object.keys(item).forEach((key) => {
            if (Array.isArray(item[key])) {
              const filteredNested = item[key].filter((entry: any) => {
                const amount = parseFloat(entry.amount || 0);
                return (
                  (minAmount === 0 && maxAmount === 0) ||
                  (minAmount > 0 && (!maxAmount || amount >= minAmount)) ||
                  (maxAmount > 0 && (!minAmount || amount <= maxAmount)) ||
                  (minAmount &&
                    maxAmount &&
                    amount >= minAmount &&
                    amount <= maxAmount)
                );
              });
              if (filteredNested.length > 0) hasMatchingData = true;
              filteredItem[key] = filteredNested;
            }
          });
          return hasMatchingData ? filteredItem : null;
        })
        .filter(Boolean)
        .slice(0, limit > 0 ? limit : undefined);
    };

    const getFilteredExpenses = async (model: any) => {
      const pipeline: any[] = [
        { $match: buildExpenseMatch() },
        { $sort: { updatedAt: -1 } },
      ];
      if (limit > 0) pipeline.push({ $limit: limit });
      const data = await model.aggregate(pipeline);
      return applyExpenseFilters(data);
    };

    let officeExpense = [];
    let toPayExpense = [];
    let travelExpense = [];

    if (["all", "allExpense", "officeExpense"].includes(transactionType)) {
      officeExpense = await getFilteredExpenses(OfficeExpense);
    }
    if (["all", "allExpense", "toPayExpense"].includes(transactionType)) {
      toPayExpense = await getFilteredExpenses(ToPayExpense);
    }
    if (["all", "allExpense", "travelExpense"].includes(transactionType)) {
      travelExpense = await getFilteredExpenses(TravelExpense);
    }
    return NextResponse.json(
      {
        type: "SUCCESS",
        account,
        officeExpense,
        toPayExpense,
        travelExpense,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { type: "ERROR", message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
