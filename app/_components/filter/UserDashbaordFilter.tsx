"use client";
import React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface FilterFormValues {
  fromDate: Date | null;
  toDate: Date | null;
  expenseType: string;
}

interface FilterProps {
  onApplyTransactionDetailsFilters: (data: FilterFormValues) => void;
}

// Animation variants for form fields
const fieldVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export default function UserDashboardFilterModal({
  onApplyTransactionDetailsFilters,
}: FilterProps) {
  const today = new Date();
  const defaultFrom = new Date();
  // defaultFrom.setDate(today.getDate() - 7);

  const { register, handleSubmit, reset, control, setValue } =
    useForm<FilterFormValues>({
      defaultValues: {
        fromDate: defaultFrom,
        toDate: today,
        expenseType: "all",
      },
    });

  const [isOpen, setIsOpen] = React.useState(false);

  const onSubmit: SubmitHandler<FilterFormValues> = (data) => {
    localStorage.removeItem("adminFilter");
    onApplyTransactionDetailsFilters(data);
    setIsOpen(false);
  };

  const setRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    if (days === 1) {
      setValue("fromDate", from);
      setValue("toDate", from);
    } else {
      setValue("fromDate", from);
      setValue("toDate", to);
    }
  };

  const setQuarterRange = (start: Date, end: Date) => {
    setValue("fromDate", start);
    setValue("toDate", end);
  };
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  return (
    <>
      <motion.button
        whileHover={{
          scale: 1.05,
          background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
        }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 p-2 rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-500 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-semibold">Filters</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm h-[90vh] mx-4 border border-blue-100 my-8 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-50">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
                  Expense Filters
                </h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="text-blue-600 hover:text-blue-800 text-3xl transition-colors"
                >
                  &times;
                </motion.button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Expense Type */}
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Expense Type
                  </label>
                  <select
                    {...register("expenseType")}
                    className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="all">All Expenses</option>
                    <option value="office">Office Expense</option>
                    <option value="travel">Travel Expense</option>
                    <option value="toPay">To Pay Expense</option>
                  </select>
                </motion.div>

                {/* Quick Range Buttons */}
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
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
                  <motion.div
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
                  </motion.div>
                </motion.div>

                {/* Date Pickers */}
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      From Date
                    </label>
                    <Controller
                      control={control}
                      name="fromDate"
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          placeholderText="Select start date"
                          dateFormat="dd/MM/yyyy"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      To Date
                    </label>
                    <Controller
                      control={control}
                      name="toDate"
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          placeholderText="Select end date"
                          dateFormat="dd/MM/yyyy"
                        />
                      )}
                    />
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                  className="flex justify-end gap-3 mt-8 pt-6 border-t border-blue-50"
                >
                  <motion.button
                    type="button"
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      reset();
                      setIsOpen(false);
                    }}
                    className="px-6 py-2 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-600 text-white hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Apply Filters
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
