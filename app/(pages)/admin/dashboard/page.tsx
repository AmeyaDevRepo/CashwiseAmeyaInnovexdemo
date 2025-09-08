"use client";
import client from "@createRequest";
import React, { useEffect } from "react";
import Loader from "@app/_components/Loader";
import Sidebar from "@app/_components/Sidebar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import DownloadReportModal from "@app/_components/reports/Reports";
import { FaEye, FaLongArrowAltRight } from "react-icons/fa";
import AdminExpenseDetailsModal from "@app/_components/dashbaordComps/AdminExpenseDetailsModal";
import AdminDashboardFilterModal from "@app/_components/filter/AdminDashboardFilter";
import { useAppSelector } from "@redux/redux.hooks";
import { selectCurrency } from "@redux/currency/currencySlice";
import useCurrency from "@hooks/useCurrency";

const tableHeaders = [
  "Name",
  "Balance",
  "Expense Type",
  "Conveyance",
  "Purchase",
  "Food",
  "Tea",
  "Hotel",
  "Courier",
  "Loading",
  "Porter",
  "Cartage",
  "Rider",
  "Daily Wages",
  "Transport",
  "Maintenance",
  "Labour",
  "Contractor",
  "Other",
];

const calculateTotal = (items: any[]) => {
  return items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
};

const getDefaultDates = () => {
  const today = new Date();
  const defaultFrom = new Date();
  return {
    from: defaultFrom.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

const calculateMoney = (item: any) => {
  let totalOfficeCreditMoney = 0;
  let totalOfficeDebitMoney = 0;
  let totalTravelCreditMoney = 0;
  let totalTravelDebitMoney = 0;
  let totalToPayDebitMoney = 0;
  let totalToPayCreditMoney = 0;
  let totalOtherDebitMoney = 0;
  let totalOtherCreditMoney = 0;
  let balance = 0;

  // Calculate total credit money based on reason
  (item.credit || []).forEach((creditItem: any) => {
    const creditSum = creditItem.transactionDetails.reduce(
      (acc: number, transaction: any) => {
        if (transaction.reason === "office") {
          totalOfficeCreditMoney += transaction.money || 0;
        } else if (transaction.reason === "travel") {
          totalTravelCreditMoney += transaction.money || 0;
        } else if (transaction.reason === "toPay") {
          totalToPayCreditMoney += transaction.money || 0;
        } else {
          totalOtherCreditMoney += transaction.money || 0;
        }
        return acc;
      },
      0
    );
  });

  // Calculate total debit money based on reason
  (item.debit || []).forEach((debitItem: any) => {
    const debitSum = debitItem.transactionDetails.reduce(
      (acc: number, transaction: any) => {
        if (transaction.reason === "office") {
          totalOfficeDebitMoney += transaction.money || 0;
        } else if (transaction.reason === "travel") {
          totalTravelDebitMoney += transaction.money || 0;
        } else if (transaction.reason === "toPay") {
          totalToPayDebitMoney += transaction.money || 0;
        } else {
          totalOtherDebitMoney += transaction.money || 0;
        }
        return acc;
      },
      0
    );
  });

  // Calculate balances
  const balanceOffice = Math.round(
    totalOfficeCreditMoney - totalOfficeDebitMoney
  );
  const balanceTravel = Math.round(
    totalTravelCreditMoney - totalTravelDebitMoney
  );
  const balanceToPay = Math.round(totalToPayCreditMoney - totalToPayDebitMoney);
  const balanceOther = Math.round(totalOtherCreditMoney - totalOtherDebitMoney);
  balance = Math.round(
    balanceOffice + balanceTravel + balanceToPay + balanceOther
  );
  return {
    totalOfficeCreditMoney,
    totalOfficeDebitMoney,
    totalTravelCreditMoney,
    totalTravelDebitMoney,
    totalToPayCreditMoney,
    totalToPayDebitMoney,
    totalOtherCreditMoney,
    totalOtherDebitMoney,
    balanceOffice,
    balanceTravel,
    balanceToPay,
    balanceOther,
    balance,
  };
};
export default function Page() {
  const router = useRouter();
  const { currency, error }:any = useCurrency();
  
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [expenseDataModal, setExpenseDataModal] = React.useState(false);
  const [expenseType, setExpenseType] = React.useState("all");
  const [name, setName] = React.useState("");
  const [userExpenseData, setUserExpenseData] = React.useState<any>(null);
  const [fromDateState, setFromDate] = React.useState(getDefaultDates().from);
  const [toDateState, setToDate] = React.useState(getDefaultDates().from);
  useEffect(() => {
    const fetchData = async () => {
      if (!fromDateState || !toDateState) return; // prevent premature fetch
      setLoading(true);
      try {
        const response = await client.get("/admin/dashboard", {
          params: {
            fromDate: fromDateState,
            toDate: toDateState,
            name,
            expenseType,
          },
        });

        if (response.status === 200) {
          const data = response.data;
          const combined = [
            ...(data.officeExpense?.map((e: any) => ({
              ...e,
              type: "Office",
            })) || []),
            ...(data.travelExpense?.map((e: any) => ({
              ...e,
              type: "Travel",
            })) || []),
            // ...(data.toPayExpense?.map((e: any) => ({
            //   ...e,
            //   type: "To Pay",
            // })) || []),
          ];
          setExpenses(combined);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDateState, toDateState, name, expenseType]);

  const onApplyTransactionDetailsFilters = async (filters: any) => {
    setFromDate(filters.fromDate?.toISOString().split("T")[0] || "");
    setToDate(filters.toDate?.toISOString().split("T")[0] || "");
    setName(filters.name);
    setExpenseType(filters.expenseType);
  };

  const handleClick = ({ name, expenseType, field, categoryData }: any) => {
    setUserExpenseData({
      name,
      expenseType,
      field,
      categoryData,
      fromDate: fromDateState,
      toDate: toDateState,
    });
    setExpenseDataModal(true);
  };
  const handleModalClose = () => {
    setExpenseDataModal(false);
  };
  return (
    <section className="flex flex-col bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <div className="flex-1 p-4 overflow-hidden">
          {loading && <Loader />}

          <div className="flex flex-wrap justify-between items-center mt-12 md:mt-2 mb-4 gap-2">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
                Expense Dashboard
              </h1>
              <p className="text-gray-600 mb-6 hidden md:block">
                Track and manage all expenses
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder="Search Name..."
                className="bg-gray-200/50 border border-gray-600 rounded-md p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />{" "}
            </div>
            {/* <DownloadReportModal /> */}
            <AdminDashboardFilterModal
              onApplyTransactionDetailsFilters={
                onApplyTransactionDetailsFilters
              }
            />
            <div>
              <h2 className="text-sm ">Date Filter Applied</h2>
              <p className="text-sm p-2 bg-blue-500 rounded-full shadow-md text-white">
                {(() => {
                  const from = new Date(fromDateState);
                  const to = new Date(toDateState);
                  const diffTime = Math.abs(to.getTime() - from.getTime());
                  const diffDays =
                    Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  if (
                    diffDays === 1 &&
                    new Date().getDate() === from.getDate() &&
                    new Date().getDate() === to.getDate()
                  ) {
                    return "Today";
                  } else if (diffDays === 1) {
                    return "Yesterday";
                  } else if (diffDays === 8) {
                    return "Week";
                  } else if (diffDays === 31) {
                    return "Month";
                  } else {
                    return `${diffDays - 1} day${diffDays > 1 ? "s" : ""}`;
                  }
                })()}
              </p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className=" rounded-lg shadow-sm border border-gray-200 overflow-x-auto max-h-[80vh] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {tableHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="px-4 bg-gray-300/70 border-b border-b-gray-600 sticky py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-400">
                  {expenses.map((expense, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-200 transition-colors cursor-pointer "
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {expense.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {" "}
                        {currency?.currencySymbol} {Math.round(calculateMoney(expense.user).balance)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {expense.type}
                      </td>
                      {[
                        "conveyance",
                        "purchase",
                        "food",
                        "tea",
                        "hotel",
                        "courier",
                        "loading",
                        "porter",
                        "cartage",
                        "rider",
                        "daily Wages",
                        "transport",
                        "maintenance",
                        "labour",
                        "contractor",
                        "other",
                      ].map((category, idx) => {
                        const total = calculateTotal(expense[category]);
                        return (
                          <td
                            key={idx}
                            className="px-4 py-3 text-sm text-gray-700"
                          >
                            {total > 0 ? (
                              <span className="text-blue-500">
                                {" "}
                                <strong className="flex items-center gap-1">
                                  {" "}
                                  {currency?.currencySymbol}{total.toLocaleString()}{" "}
                                  <FaLongArrowAltRight
                                    onClick={() => {
                                      window.location.href = `/users/expenses/${expense.user._id}`;
                                    }}
                                    className="text-md  cursor-pointer text-blue-500"
                                  />
                                </strong>
                                <FaEye
                                  className="text-md text-black"
                                  onClick={() =>
                                    handleClick({
                                      name: expense?.user?.name,
                                      expenseType: expense?.type,
                                      field: category,
                                      categoryData: expense[category],
                                    })
                                  }
                                />
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                      {/*                       
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.conveyance)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.purchase)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.food)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.tea)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.hotel)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.courier)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.loading)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.porter)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.cartage)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.rider)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.dailyWages)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.transport)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.maintenance)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.labour)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.contractor)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {currency?.currencySymbol}{Math.round(calculateTotal(expense.other))}
                      </td> */}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && !loading && (
                <div className="text-center py-6 text-gray-500">
                  No expenses found for the selected filters
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {expenseDataModal && (
        <AdminExpenseDetailsModal
          closeModal={handleModalClose}
          userExpenseData={userExpenseData}
        />
      )}
    </section>
  );
}
