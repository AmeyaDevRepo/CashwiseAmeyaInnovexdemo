"use client";
import client from "@createRequest";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { RxCross2 } from "react-icons/rx";
import Loader from "../Loader";
import { useAppSelector } from "@redux/redux.hooks";
import { selectUser } from "@redux/users/userSlice";
import { useRouter } from "next/navigation";

type ExpenseLimitProps = {
  closeModal: () => void;
  selectedUsersExpenseLimit: any;
  selectAllChecked: boolean;
};

const formFields = [
  "Conveyance",
  "Purchase",
  "Food",
  "Tea",
  "Hotel",
  "Labour",
  "Courier",
  "Loading",
  "Porter",
  "Cartage",
  "Rider",
  "Daily Wages",
  "Transport",
  "Maintenance",
  "Contractor",
  "Other",
  "Max Limit",
];

const modalVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
  exit: { opacity: 0, y: 20 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export default function ExpenseLimitForm({
  closeModal,
  selectedUsersExpenseLimit,
  selectAllChecked,
}: ExpenseLimitProps) {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [visibleDropdown, setVisibleDropdown] = useState<string | null>(null);
  const [userData, setUserData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSave, setActionSave] = useState("permanent");
  const [usersToChange, setUsersToChange] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues:
      selectedUsersExpenseLimit.length > 1 ? [] : selectedUsersExpenseLimit[0],
  });

  // function to search user to show in dropdown start********
  const watchName = watch("name");
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await client.get("/users", {
          params: { name: watchName },
        });
        if (response.status === 200) {
          setUserData(response.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserData();
  }, [watchName]);
  // function to search user to show in dropdown end********

  const handleNameClick = (name: string) => {
    setValue("name", name);
    setVisibleDropdown(null);
  };

  useEffect(() => {
    const allUserIds = selectedUsersExpenseLimit.map(
      (item: any) => item.userId as string
    );
    setUsersToChange(allUserIds);
  }, [selectedUsersExpenseLimit]);
  // form submit function start ********
  const onSubmit = async (data: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    formData.append("actionSave", actionSave);
    formData.append("usersToChange", JSON.stringify(usersToChange));
    formData.append("actionType", "old");
    formData.append("selectAllChecked", String(selectAllChecked));
    formData.append("createdBy", user?._id?.toString() || "");

    try {
      const response = await client.put("/admin/expenseLimit", formData);
      if (response.status === 200 || response.status === 201) {
        toast.success((response as any)?.data?.message);
        closeModal();
        router.refresh();
      }
    } catch (error) {
      console.log(error);
      toast.error((error as any)?.data?.message);
    } finally {
      setLoading(false);
    }
  };
  // form submit function end ********

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={backdropVariants}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={closeModal}
    >
      {loading && <Loader />}
      <motion.div
        variants={modalVariants}
        className="relative bg-white rounded-xl shadow-lg max-w-sm w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RxCross2 className="w-6 h-6" />
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-6 ">
            Expense Limit{" "}
            <span className="text-sm text-gray-400">
              {selectedUsersExpenseLimit.length > 0 ? getValues("name") : ``}
            </span>
          </h2>

          {selectedUsersExpenseLimit &&
            selectedUsersExpenseLimit.length === 1 && (
              <div className="flex flex-col w-full relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <motion.input
                  {...register("name", { required: true })}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onFocus={() => setVisibleDropdown("name")}
                />
                {errors.name && (
                  <span className="text-red-500 text-sm">Name is required</span>
                )}

                {visibleDropdown === "name" && userData.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md top-full">
                    <div className="p-2 border-b flex justify-between items-center bg-gray-100">
                      <span className="text-sm text-gray-600">Select User</span>
                      <RxCross2
                        className="text-red-400 cursor-pointer text-lg"
                        onClick={() => setVisibleDropdown(null)}
                      />
                    </div>
                    <ul className="max-h-40 overflow-auto">
                      {userData.map((item) => (
                        <li
                          key={item._id}
                          onClick={() => handleNameClick(item.name)}
                          className="p-2 hover:bg-purple-50 cursor-pointer text-sm"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          <div className="grid grid-cols-2 gap-4">
            {formFields.map((field) => {
              const fieldName = field.toLowerCase().replace(" ", "_");
              return (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-700">
                    {field}
                  </label>
                  <motion.input
                    {...register(fieldName, {
                      valueAsNumber: true,
                    })}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="space-y-1"
            >
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <motion.select
                {...register("status")}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Active">Active</option>
                <option value="In-Active">In-Active</option>
                <option value="Blocked">Blocked</option>
              </motion.select>
            </motion.div>
          </div>

          <div className="mt-6 flex justify-end gap-3 text-sm">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              type="submit"
              className=" p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              onClick={() => setActionSave("permanent")}
            >
              Update Limit
            </motion.button>
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              type="submit"
              className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              onClick={()=>setActionSave('temporary')}
            >
              Set Temporary
            </motion.button> */}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
