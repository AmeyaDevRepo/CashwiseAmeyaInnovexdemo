"use client";
import Loader from "@app/_components/Loader";
import Sidebar from "@app/_components/Sidebar";
import React from "react";
import axios from "axios";
import { SelectProps } from "antd";
import "antd/dist/reset.css";
import { Controller, useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import { useDownloadExcel } from "@hooks/useDownloadExcel";
import Select from "antd/es/select";
import { toast } from "react-toastify";
import { DateTime } from "luxon";
import StyledPDFGenerator from "@hooks/useDownloadPDF";
const { Option } = Select;

interface ReportFormData {
  fromDate: Date | null;
  toDate: Date | null;
}

export default function Report() {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [reportType, setReportType] = React.useState<string>("users");
  const [accountReportTypes, setAccountReportTypes] =
    React.useState<string>("credit-debit");
  const [resultData, setResultData] = React.useState<any>(null);
  const [transactionTypes, setTransactionTypes] = React.useState<string[]>([]);
  const [formFields, setFormFields] = React.useState<string[]>([]);
  const [userId, setUserId] = React.useState<string[]>(["all"]);
  const [usersData, setUsersData] = React.useState<any[]>([]);
  const [limit, setLimit] = React.useState<boolean>(false);
  const [limitValue, setLimitValue] = React.useState<number>(1000);
  const [mounted, setMounted] = React.useState(false);
  const { downloadExcel } = useDownloadExcel();
  const [accountFieldTypes, setAccountFieldTypes] =
    React.useState<string>("all");
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ReportFormData>({
    defaultValues: {
      fromDate: null,
      toDate: null,
    },
  });

  const watchedFromDate = watch("fromDate");
  const watchedToDate = watch("toDate");
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Include full today

  // Animation trigger
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch users on component mount
  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/users");
      if (response.status === 200) {
        setUsersData(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const userOptions =
    usersData?.map((user: any) => ({
      label: user.name,
      value: user._id,
    })) || [];

  const handleUserChange = (value: string[]) => {
    setUserId(value);
  };

  const handleTransactionTypeChange = (value: string[]) => {
    setTransactionTypes(value);
  };

  const handleFormFieldsChange = (value: string[]) => {
    setFormFields(value);
  };

  const resetFilters = () => {
    setAccountReportTypes("credit-debit");
    setTransactionTypes([]);
    setFormFields([]);
    setUserId([]);
    setValue("fromDate", null);
    setValue("toDate", null);
    setLimit(false);
    setLimitValue(1000);
  };

  // Reset filters when report type changes
  React.useEffect(() => {
    resetFilters();
  }, [reportType]);

  const validateDateRange = () => {
    if (!watchedFromDate || !watchedToDate) {
      return null;
    }

    const fromDate = DateTime.fromISO(
      watchedFromDate?.toISOString() ?? ""
    ).startOf("day");
    const toDate = DateTime.fromISO(watchedToDate?.toISOString() ?? "").endOf(
      "day"
    );
    const today = DateTime.now().endOf("day");

    // Rule 1: fromDate < toDate
    if (fromDate > toDate) {
      return "From date cannot be later than To date";
    }

    // Rule 2: toDate ≤ today
    if (toDate > today) {
      return "To date cannot be greater than today";
    }

    // Rule 3: dateRange ≤ 1 month
    if (toDate.diff(fromDate, "months").months > 1) {
      return "Date range cannot be greater than 1 month";
    }

    return null;
  };

  const isDownloadDisabled = () => {
    return !watchedFromDate || !watchedToDate;
  };

  const stepDelay = (index: number) => ({
    animationDelay: `${index * 0.1}s`,
  });

  // Animation variants for motion.div and motion.button
  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Set quick date range (Today, Yesterday, 1 Week, 1 Month)
  const setRange = (days: number) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let from: Date;
    let to: Date = new Date(now);
    if (days === 0) {
      // Today
      from = new Date(now);
    } else if (days === 1) {
      // Yesterday
      from = new Date(now);
      from.setDate(from.getDate() - 1);
      to = new Date(from);
    } else {
      from = new Date(now);
      from.setDate(from.getDate() - days + 1);
    }
    setValue("fromDate", from);
    setValue("toDate", to);
  };

  // Set quarter range
  const setQuarterRange = (start: Date, end: Date) => {
    setValue("fromDate", start);
    setValue("toDate", end);
  };

  const handleReportDownload = async (
    format: "excel" | "pdf" | "csv" = "excel"
  ) => {
    const dateValidation = validateDateRange();
    if (dateValidation) {
      toast.error(dateValidation);
      console.log("Date validation error:", dateValidation);
      return;
    }
    // if(userId.length === 0){
    //   toast.error("Please select at least one user or 'all'");
    //   return;
    // }

    setLoading(true);
    try {
      const reportData = {
        accountReportTypes,
        accountFieldTypes,
        users: userId,
        formFields: formFields,
        fromDate: watchedFromDate?.toISOString(),
        toDate: watchedToDate?.toISOString(),
      };
      const response = await axios.post("/api/reports/userReports", reportData);
      if (response.status === 200) {
        setResultData(response.data.data);
        // const result = await downloadExcel({
        //   data: response.data.data,
        //   format: "excel",
        // });

        // if (result.success) {
        //   console.log("Download completed successfully");
        // } else {
        //   console.error("Download failed:", result.message);
        // }
      }
      // Create blob link to download
      // const url = window.URL.createObjectURL(new Blob([response?.data?.officeExpenseReports,response?.data?.personalExpenseReports]));
      // const link = document.createElement("a");
      // link.href = url;

      // Generate filename based on report type and date
      // const timestamp = new Date().toISOString().split("T")[0];
      // const extension =
      //   format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv";
      // link.setAttribute(
      //   "download",
      //   `${reportType}_report_${timestamp}.${extension}`
      // );

      // document.body.appendChild(link);
      // link.click();
      // link.remove();
      // window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50 min-h-screen">
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <div className="flex-1 p-4 overflow-hidden relative">
          {loading && <Loader />}

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          <div
            className={`relative z-10 transition-all duration-1000 ease-out ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            {/* Header */}
            <div className="text-center mb-4 mt-2">
              <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 tracking-tight">
                Report Generator
              </h1>
              <p className="text-xl text-gray-600 font-light">
                Generate comprehensive reports with advanced filtering options
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-500 mx-auto mt-4 rounded-full"></div>
            </div>
            {/* Main Card */}
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] p-8 border border-white/20 hover:shadow-[0_25px_60px_rgba(8,_112,_184,_0.15)] transition-all duration-500">
              {/* Step 1: Select Report Type */}
              <div
                className={`mb-8 transition-all duration-700 ease-out ${
                  mounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={stepDelay(1)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    1
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Select Report Type
                  </h3>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {["users"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        reportType === type
                          ? "bg-gradient-to-r from-blue-500 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-gray-200 text-gray-700 hover:bg-white border border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)} Report
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Configure Options */}
              <div
                className={`mb-8 transition-all duration-700 ease-out ${
                  mounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={stepDelay(2)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    2
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Configure Report Options
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-white/50 to-blue-50/50 rounded-2xl p-6 backdrop-blur-sm border border-white/30">
                  {/* {reportType === "account" && (
                    <div className="space-y-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                          👥 Select Users
                        </label>
                        <Select
                          mode="multiple"
                          style={{ width: "100%" }}
                          placeholder="Select Users (optional)"
                          value={userId}
                          onChange={handleUserChange}
                          options={userOptions}
                          defaultValue={["all"]}
                          className="custom-select"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                            📁 Fields Type
                          </label>
                          <Select
                            style={{ width: "100%" }}
                            placeholder="Select Fields (optional)"
                            value={accountReportTypes || "all"}
                            onChange={(value) => setAccountReportTypes(value)}
                            options={[
                              { label: "All Fields", value: "all" },
                              { label: "Personal", value: "personal" },
                              { label: "Office", value: "office" },
                            ]}
                          />
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                            💳 Transaction Types
                          </label>
                          <Select
                            style={{ width: "100%" }}
                            placeholder="Select Transaction Types"
                            value={transactionTypes}
                            mode="multiple"
                            onChange={handleTransactionTypeChange}
                            options={[
                              { label: "All Transactions", value: "all" },
                              { label: "💰 Credit", value: "credit" },
                              { label: "💸 Debit", value: "debit" },
                              { label: "🧾 Expense", value: "expense" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )} */}

                  {reportType === "users" && (
                    <div className="space-y-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                          👥 Select Users
                        </label>
                        <Select
                          mode="multiple"
                          style={{ width: "100%" }}
                          placeholder="Select Users (optional)"
                          value={userId}
                          onChange={handleUserChange}
                          options={userOptions}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                            📁 Report Type
                          </label>
                          <Select
                            style={{ width: "100%" }}
                            placeholder="Select Fields (optional)"
                            value={accountReportTypes || "credit-debit"}
                            onChange={(value) => setAccountReportTypes(value)}
                            options={[
                              { label: "Credit-Debit", value: "credit-debit" },
                              { label: "Expense", value: "expense" },
                            ]}
                          />
                        </div>
                        {accountReportTypes === "expense" && (
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                              📁 Fields Type
                            </label>
                            <Select
                              style={{ width: "100%" }}
                              placeholder="Select Fields (optional)"
                              value={accountFieldTypes || "all"}
                              onChange={(value) => setAccountFieldTypes(value)}
                              options={[
                                { label: "All Fields", value: "all" },
                                { label: "Office", value: "office" },
                                { label: "Travel", value: "travel" },
                                { label: "ToPay", value: "toPay" },
                              ]}
                            />
                          </div>
                        )}
                        {accountReportTypes === "expense" && (
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                              📝 Form Fields
                            </label>
                            <Select
                              style={{ width: "100%" }}
                              placeholder="Select Form Fields (optional)"
                              value={formFields}
                              mode="multiple"
                              onChange={handleFormFieldsChange}
                              options={[
                                "All",
                                "conveyance",
                                "purchase",
                                "food",
                                "tea",
                                "hotel",
                                "water",
                                "courier",
                                "kitchen",
                                "training",
                                "vehicle",
                                "recharge",
                                "transport",
                                "marketing",
                                "medical",
                                "policy",
                                "maintenance",
                                "other",
                              ].map((field) => ({
                                label:
                                  field.charAt(0).toUpperCase() +
                                  field.slice(1),
                                value: field.toLowerCase(),
                              }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* {reportType === "fields" && (
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">
                        📁 Fields Type
                      </label>
                      <Select
                        style={{ width: "100%" }}
                        placeholder="Select Fields"
                        value={accountReportTypes || undefined}
                        onChange={(value) => setAccountReportTypes(value)}
                        options={[
                          { label: "All Fields", value: "all" },
                          { label: "Personal", value: "personal" },
                          { label: "Office", value: "office" },
                        ]}
                      />
                    </div>
                  )} */}
                </div>
              </div>

              {/* Step 3: Date Range */}
              <div
                className={`mb-8 transition-all duration-700 ease-out ${
                  mounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={stepDelay(3)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    3
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Select Date Range <span className="text-red-500">*</span>
                  </h3>
                </div>
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="ml-6 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <p className="text-sm font-medium text-blue-900">
                    Quick Range
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 0, 7, 30].map((days) => (
                      <motion.button
                        key={days}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRange(days)}
                        className="px-3 py-1.5 text-sm rounded-full bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 hover:border-blue-400 text-blue-700 transition-all"
                      >
                        {days === 1
                          ? "Yesterday"
                          : days === 0
                          ? "Today"
                          : days === 7
                          ? "1 Week"
                          : "1 Month"}
                      </motion.button>
                    ))}
                  </div>
                  {/* <motion.div
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2 flex-wrap">
                      {[
                        {
                          label: "Jan-Mar",
                          start: new Date(new Date().getFullYear(), 0, 1),
                          end: new Date(new Date().getFullYear(), 2, 31),
                        },
                        {
                          label: "Apr-Jun",
                          start: new Date(new Date().getFullYear(), 3, 1),
                          end: new Date(new Date().getFullYear(), 5, 30),
                        },
                        {
                          label: "Jul-Sept",
                          start: new Date(new Date().getFullYear(), 6, 1),
                          end: new Date(new Date().getFullYear(), 8, 30),
                        },
                        {
                          label: "Oct-Dec",
                          start: new Date(new Date().getFullYear(), 9, 1),
                          end: new Date(new Date().getFullYear(), 11, 31),
                        },
                      ].map((quarter) => (
                        <motion.button
                          key={quarter.label}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setQuarterRange(quarter.start, quarter.end)
                          }
                          className="px-3 py-1.5 text-sm rounded-full bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 hover:border-blue-400 text-blue-700 transition-all"
                        >
                          {quarter.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div> */}
                </motion.div>
                <div className="bg-gradient-to-br from-white/50 to-blue-50/50 rounded-2xl p-6 backdrop-blur-sm border border-white/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-blue-700 mb-3 group-hover:text-blue-800 transition-colors">
                        📅 From Date *
                      </label>
                      <Controller
                        name="fromDate"
                        control={control}
                        rules={{ required: "From date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => field.onChange(date)}
                            showTimeSelect={false}
                            dateFormat="d MMM yyyy"
                            placeholderText="dd/mm/yyyy"
                            minDate={new Date("2025-01-01")}
                            className={`border-2 rounded-xl w-full text-sm px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm z-30 ${
                              errors.fromDate
                                ? "border-red-400"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          />
                        )}
                      />
                      {errors.fromDate && (
                        <p className="text-red-500 text-xs mt-2 font-medium animate-pulse">
                          {errors.fromDate.message}
                        </p>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-blue-700 mb-3 group-hover:text-blue-800 transition-colors">
                        📅 To Date *
                      </label>
                      <Controller
                        name="toDate"
                        control={control}
                        rules={{ required: "To date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => field.onChange(date)}
                            showTimeSelect={false}
                            dateFormat="d MMM yyyy"
                            placeholderText="dd/mm/yyyy"
                            minDate={watchedFromDate ?? undefined}
                            maxDate={today} // Ensures today is selectable
                            className={`border-2 rounded-xl w-full text-sm px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                              errors.toDate
                                ? "border-red-400"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          />
                        )}
                      />
                      {errors.toDate && (
                        <p className="text-red-500 text-xs mt-2 font-medium animate-pulse">
                          {errors.toDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Limit */}
              {/* <div className={`mb-8 `} style={stepDelay(4)}>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    4
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Set Record Limit (Optional)
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-white/50 to-green-50/50 rounded-2xl p-6  border border-white/30">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="limitCheckbox"
                        checked={limit}
                        onChange={(e) => setLimit(e.target.checked)}
                        className="mr-3 h-5 w-5  accent-blue-500 rounded transition-all duration-200"
                      />
                      <label
                        htmlFor="limitCheckbox"
                        className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        🔢 Enable record limit
                      </label>
                    </div>

                    <div
                      className={`transition-all duration-500 overflow-hidden ${
                        limit ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="flex items-center space-x-4 pt-2">
                        <label
                          htmlFor="limit"
                          className="text-sm font-semibold text-gray-700 whitespace-nowrap"
                        >
                          Maximum records:
                        </label>
                        <input
                          type="number"
                          id="limit"
                          min="1"
                          max="10000"
                          value={limitValue}
                          onChange={(e) =>
                            setLimitValue(Number(e.target.value))
                          }
                          className="border-2 rounded-xl w-32 text-sm px-4 py-2 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 border-gray-200 bg-white/80  transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>  */}

              {/* Step 5: Download */}
              <div
                className={`border-t-2 border-gradient-to-r from-blue-200 to-blue-200 pt-8 transition-all duration-700 ease-out ${
                  mounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={stepDelay(5)}
              >
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Download Report
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate and download your report in your preferred format
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/60 to-blue-50/60 rounded-2xl p-6 backdrop-blur-sm border border-white/40">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      🔄 Reset Filters
                    </button>

                    {/* <button
                      onClick={() => handleReportDownload("excel")}
                      disabled={isDownloadDisabled() || loading}
                      className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isDownloadDisabled() || loading
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl shadow-green-500/25"
                      }`}
                    >
                      {loading ? "⏳ Generating..." : "📊 Download Excel"}
                    </button> */}
                    {!resultData && (
                      <button
                        onClick={() => handleReportDownload("pdf")}
                        disabled={isDownloadDisabled() || loading}
                        className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                          isDownloadDisabled() || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl shadow-red-500/25"
                        }`}
                      >
                        {loading ? "⏳ Generating..." : "📄 Generate PDF"}
                      </button>
                    )}
                    {resultData && (
                      <StyledPDFGenerator
                        userData={resultData}
                        setResultData={setResultData}
                      />
                    )}

                    {/* <button
                      onClick={() => handleReportDownload("csv")}
                      disabled={isDownloadDisabled() || loading}
                      className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isDownloadDisabled() || loading
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-blue-500 text-white hover:from-blue-600 hover:to-blue-600 shadow-lg hover:shadow-xl shadow-blue-500/25"
                      }`}
                    >
                      {loading ? "⏳ Generating..." : "📋 Download CSV"}
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-select .ant-select-selector {
          border-radius: 12px !important;
          border: 2px solid #e5e7eb !important;
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(8px) !important;
          transition: all 0.2s !important;
        }

        .custom-select .ant-select-selector:hover {
          border-color: #60a5fa !important;
        }

        .custom-select .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }

        @keyframes springIn {
          0% {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          60% {
            transform: translateY(-5px) scale(1.02);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .spring-animation {
          animation: springIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </section>
  );
}
