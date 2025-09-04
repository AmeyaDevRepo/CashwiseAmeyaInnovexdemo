"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPen } from "react-icons/fa";
import Sidebar from "@app/_components/Sidebar";
import Loader from "@app/_components/Loader";
import ExpenseLimitForm from "@app/_components/expenseLimit/ExpenseLimitForm";
import { toast } from "react-toastify";
import client from "@createRequest";
import { TableData } from "@app/_interface/expenseLimit.interface";

const AnimatedTable = () => {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<TableData>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const [selectedUsersExpenseLimit, setSelectedUsersExpenseLimit] = useState<
    TableData[]
  >([]);
  const [expenseLimitData, setExpenseLimitData] = useState<TableData[]>([]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const rowVariants = {
    hover: {
      scale: 1.02,
      backgroundColor: "rgba(99, 102, 241, 0.05)",
      transition: { duration: 0.3 },
    },
  };

  const handleUpdateClick = () => {
    // setCurrentExpenseLimit(user);
    if (selectedUsers && selectedUsers.size <= 0) {
      return toast.error("Please select user to update Limit!");
    }
    setSelectedUsersExpenseLimit(Array.from(selectedUsers));
    setModal(true);
  };

  const closeExpenseFormModal = () => {
    setModal(false);
    setSelectedUsersExpenseLimit([]);
  };

  const handleSelect = (item: TableData) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAllChecked) {
      setSelectedUsers(new Set());
      setSelectAllChecked(false);
    } else {
      const newSet = new Set(expenseLimitData);
      setSelectedUsers(newSet);
      setSelectAllChecked(true);
    }
  };

  const fetchUserExpenseLimit = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await client.get("/admin/expenseLimit", {
        params: { name, page },
      });
      const data = response?.data?.result || [];
      if (data.length === 0) setHasMore(false);
      // filter expenseLimitData for selected users based on _id
      setExpenseLimitData((prev) =>
        page === 1 ? [...data] : [...prev, ...data]
      );
      setPage((prev) => prev + 1);
    } catch (error) {
      toast.error((error as any)?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [name]);

  useEffect(() => {
    fetchUserExpenseLimit();
  }, [name, page]);

  useEffect(() => {
    if (loading || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchUserExpenseLimit();
      }
    });

    if (lastRowRef.current) {
      observer.current.observe(lastRowRef.current);
    }

    return () => observer.current?.disconnect();
  }, [expenseLimitData]);

  return (
    <section className="flex flex-col bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <div className="flex-1 overflow-hidden max-h-screen">
          {loading && <Loader />}

          <div className="flex flex-col md:flex-row items-center justify-between my-4 px-4 gap-4">
            <h1 className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent text-2xl font-semibold mb-4 md:mb-0">
              User Expense Limit
            </h1>
            <input
              type="text"
              placeholder="Search Name..."
              className="bg-gray-200/50 border border-gray-600 rounded-md p-2"
              onChange={(e) => {
                setExpenseLimitData([]);
                setName(e.target.value);
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.04 }}
              className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg"
              onClick={() => handleUpdateClick()}
            >
              Update Limit
            </motion.button>
          </div>
          <motion.div
            initial="initial"
            animate="animate"
            variants={pageVariants}
            className="p-2 overflow-x-auto"
          >
            <div className="rounded-lg border border-gray-200 shadow-sm max-h-[80vh] overflow-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="whitespace-nowrap flex gap-1">
                        <input
                          type="checkbox"
                          className="accent-purple-500 float-left pt-2"
                          checked={selectAllChecked}
                          onChange={handleSelectAll}
                        />
                        Select
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conveyance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Food
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Labour
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Daily Wages
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transport
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contractor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Max Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions By
                    </th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 py-4">
                  {Array.from(selectedUsers).map((item, index) => {
                    const isLastRow = index === selectedUsers.size - 1;
                    return (
                      <motion.tr
                        ref={isLastRow ? lastRowRef : null}
                        key={item._id}
                        variants={rowVariants}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="group hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-purple-600">
                          <input
                            type="checkbox"
                            className="accent-purple-500"
                            checked={selectedUsers.has(item)}
                            onChange={() => handleSelect(item)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-purple-600">
                          {item?.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          ₹{item.conveyance}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 ">
                          ₹{item.food}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 ">
                          ₹{item.hotel}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 ">
                          ₹{item.labour}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 ">
                          ₹{item.daily_wages}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          ₹{item.transport}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 ">
                          ₹{item.contractor}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 ">
                          ₹{item.max_limit}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            item.status === "Active"
                              ? "text-green-600"
                              : item.status === "In-Active"
                              ? "text-red-500"
                              : "text-gray-600"
                          } `}
                        >
                          {item.status}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-purple-600 ">
                          {item?.createdBy?.name}
                        </td>
                      </motion.tr>
                    );
                  })}
                  {expenseLimitData
                    .filter(
                      (item) =>
                        !Array.from(selectedUsers).find(
                          (user) => user._id === item._id
                        )
                    )
                    .map((item, index) => {
                      const isLastRow = index === expenseLimitData.length - 1;
                      return (
                        <motion.tr
                          ref={isLastRow ? lastRowRef : null}
                          key={item._id}
                          variants={rowVariants}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="group hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-purple-600">
                            <input
                              type="checkbox"
                              className="accent-purple-500"
                              checked={selectedUsers.has(item._id)}
                              onChange={() => handleSelect(item)}
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-purple-600">
                            {item?.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600">
                            ₹{item.conveyance}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 ">
                            ₹{item.food}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 ">
                            ₹{item.hotel}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 ">
                            ₹{item.labour}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 ">
                            ₹{item.daily_wages}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600">
                            ₹{item.transport}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 ">
                            ₹{item.contractor}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 ">
                            ₹{item.max_limit}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm ${
                              item.status === "Active"
                                ? "text-green-600"
                                : item.status === "In-Active"
                                ? "text-red-500"
                                : "text-gray-600"
                            } `}
                          >
                            {item.status}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-purple-600 ">
                            {item?.createdBy?.name}
                          </td>
                        </motion.tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <ExpenseLimitForm
            closeModal={closeExpenseFormModal}
            selectedUsersExpenseLimit={selectedUsersExpenseLimit}
            selectAllChecked={selectAllChecked}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default AnimatedTable;
