import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { SlCalender } from "react-icons/sl";
import { toast } from "react-toastify";
import Sidebar from "@app/_components/Sidebar";
import Loader from "@app/_components/Loader";
import client from "@createRequest";
import { SiteInterface } from "@app/_interface/site.interface";
import { RxCross2 } from "react-icons/rx";
import { useAppSelector } from "@redux/redux.hooks";
import { selectUser } from "../../../redux/users/userSlice";
import { FiFileText, FiTrash2 } from "react-icons/fi";
import { FaMapLocation } from "react-icons/fa6";
import { TbTransactionRupee } from "react-icons/tb";
import { FaFileInvoice } from "react-icons/fa6";
import { ImCross } from "react-icons/im";
import useLocation from "@hooks/useLocation";
import { usePathname } from "next/navigation";
import { IUsers } from "@app/_interface/user.interface";
import { IoIosArrowDown } from "react-icons/io";
import { selectFiles } from "@redux/files/filesSlice";
import AntdFileUpload from "../AntdUpload";

// modal handle
type expenseFormProps = {
  closeModal: () => void;
};

// form interface
type FormValues = {
  siteName: string;
  expenseDate: Date | null;
  todayWork: string;
  location: object;
  rechargeType: string;
  serviceProvider: string;
  numberOfPerson: number;
  nameOfRestaurant: string;
  restaurantNumber: number | null;
  amount: number;
  paymentMode: string;
  bankName: string;
  // New Mobile-specific fields
  billDateFrom: Date | null;
  billDateTo: Date | null;
  phoneNumber: string;
  planType: string;
  description: string;
  remarks: string;
};

//   animation constants at the top of  component
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

const scaleUp = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

export default function Recharge({ closeModal }: expenseFormProps) {
  const user = useAppSelector(selectUser);
  const userLocation = useLocation();
  const [includeGST, setIncludeGST] = useState(false);
  const [GstFormModel, setGstFormModel] = useState(false);
  const path = usePathname();
  const files = useAppSelector(selectFiles);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const Error = (data: any) => toast.error(data);
  const Success = (data: any) => toast.success(data);
  const [sites, setSites] = useState<SiteInterface[]>([]);
  const [userData, setUserData] = useState<IUsers[]>([]);
  const [visibleDropdown, setVisibleDropdown] = useState<string | null>(null); // Track which dropdown is visible
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    control,
    reset,
    resetField,
    formState: { errors },
    getValues,
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      siteName: "",
      expenseDate: new Date(),
      todayWork: "",
      location: userLocation,
      rechargeType: "",
      serviceProvider: "",
      numberOfPerson: 0,
      nameOfRestaurant: "",
      restaurantNumber: null,
      amount: 0,
      paymentMode: "",
      bankName: "",
      billDateFrom: null,
      billDateTo: null,
      phoneNumber: "",
      planType: "",
      description: "",
      remarks: "",
    },
  });

  const watchSiteName = watch("siteName");
  const watchServiceProvider = watch("serviceProvider");
  const watchRechargeType = watch("rechargeType");

  // function to get site name
  useEffect(() => {
    async function allProducts() {
      try {
        const response = await client.get("/site/filtersite", {
          params: {
            siteName: watchSiteName,
          },
        });
        console.log(response);
        if (response.status === 200) {
          const resultData = ((response as any)?.data as SiteInterface[]) || [];
          setSites(resultData);
        }
      } catch (error: any) {
        Error(error.response?.data?.message || "Something went wrong!");
      } finally {
        setIsLoading(false);
      }
    }
    allProducts();
  }, [watchSiteName, path]);

  // function to set service provider name
  useEffect(() => {
    async function allUsers() {
      try {
        const response = await client.get("/users");
        if (response.status === 200) {
          const resultData = ((response as any)?.data as IUsers[]) || [];
          setUserData(resultData);
        }
      } catch (error: any) {
        Error(error.response?.data?.message || "Something went wrong!");
      } finally {
        setIsLoading(false);
      }
    }
    allUsers();
  }, [watchServiceProvider]);

  // handle form name dynamically
  let tab = path.replace(/^\/|\/$/g, "");
  const tabParts = tab.split(/(?=[A-Z])/);
  tabParts[0] = tabParts[0].charAt(0).toUpperCase() + tabParts[0].slice(1);

  const handleGSTToggle = () => {
    const newValue = !includeGST;
    setIncludeGST(newValue);
    if (newValue) {
      setGstFormModel(true); // open modal when including GST
    } else {
      setGstFormModel(false); // close modal when unchecking GST
    }
  };
  const [gstData, setGstData] = useState<any>(null);
  function handleGStForm(GstFormData: any) {
    console.log("Gst form handled", GstFormData);
    setValue("amount", Math.round(GstFormData.totalAmount));
    setGstData(GstFormData);
  }

  const onSubmit = async (data: FormValues) => {
    const formdata = new FormData();
    // Check if the user is not an admin and at least one file field is empty
    const hasValidFile = ["Payment", "Location", "Invoice"].some(
      (key) => Array.isArray(files[key]) && files[key].length > 0
    );

    if (!hasValidFile) {
      return toast.error("At least one File is required!");
    }
    formdata.append("GstData", JSON.stringify(gstData));
    formdata.append("recharge", "recharge");
    formdata.append("schema", path);
    formdata.append("user", user.name);
    formdata.append("siteName", data.siteName);
    formdata.append("expenseDate", data.expenseDate?.toString() || "");
    formdata.append("todayWork", data.todayWork);
    formdata.append("location", JSON.stringify(userLocation.currentLocation));
    formdata.append("rechargeType", data.rechargeType);
    formdata.append("serviceProvider", data.serviceProvider);
    formdata.append("numberOfPerson", data.numberOfPerson.toString());
    formdata.append("nameOfRestaurant", data.nameOfRestaurant);
    formdata.append("paymentMode", data.paymentMode);
    formdata.append("bankName", data.bankName);
    formdata.append(
      "restaurantNumber",
      data.restaurantNumber !== null ? data.restaurantNumber.toString() : ""
    );
    formdata.append(
      "amount",
      data.amount !== null ? data.amount.toString() : ""
    );
    
    // Add Mobile-specific fields to form data
    if (data.rechargeType === "Mobile") {
      formdata.append("billDateFrom", data.billDateFrom?.toString() || "");
      formdata.append("billDateTo", data.billDateTo?.toString() || "");
      formdata.append("phoneNumber", data.phoneNumber);
      formdata.append("planType", data.planType);
    }
    
    formdata.append("description", data.description);
    formdata.append("remarks", data.remarks);
    if (files.Location && Array.isArray(files.Location)) {
      files.Location.forEach((file: any) => {
        formdata.append("Location", file);
      });
    }
    if (files.Payment && Array.isArray(files.Payment)) {
      files.Payment.forEach((file: any) => {
        formdata.append("Payment", file);
      });
    }
    if (files.Invoice && Array.isArray(files.Invoice)) {
      files.Invoice.forEach((file: any) => {
        formdata.append("Invoice", file);
      });
    }

    try {
      setIsLoading(true);
      const response = await client.post(
        `/form/${user._id}/recharge`,
        formdata,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.status === 200 || response.status === 201) {
        reset();
        Success((response as any)?.data?.message);
        closeModal();
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Error("Something Went Wrong!");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSiteClick = (site: SiteInterface) => {
    setValue("siteName", site.name);
    // setValue("siteLocation", site.address);
  };
  const handleServiceProviderClick = (user: SiteInterface) => {
    setValue("serviceProvider", user.name);
    // setValue("siteLocation", site.address);
  };

  return (
    <section className="bg-[#f0ebf8] min-h-screen">
      <div className="flex">
        <Sidebar />
        {isLoading && <Loader />}

        <AnimatePresence>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="bg-[#673ab7] px-6 py-4 flex justify-between items-center"
              >
                <h2 className="text-white text-2xl font-bold">
                  {tabParts[0]} {tabParts[1]} <br />{" "}
                  <span className="text-gray-300 text-sm ">Recharge</span>{" "}
                  <br />
                </h2>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="text-white text-2xl"
                >
                  <ImCross />
                </motion.button>
              </motion.div>

              {/* Form Content */}
              <div className="p-6 space-y-2 max-h-[80vh] overflow-y-auto text-sm">
                <motion.div
                  className="space-y-1 w-full"
                  initial={fadeIn.hidden}
                  animate={fadeIn.visible}
                  exit={fadeIn.exit}
                >
                  <label className="block font-semibold">Expense Date</label>
                  <Controller
                    control={control}
                    name="expenseDate"
                    render={({ field: { onChange, value } }) => (
                      <div className="relative w-full">
                        <DatePicker
                          selected={value}
                          onChange={onChange}
                          dateFormat="dd/MM/yyyy"
                          className="border p-2 rounded-md border-gray-400"
                          placeholderText="Select Date"
                          selectsStart
                        />
                      </div>
                    )}
                  />
                  {errors.expenseDate && (
                    <p className="text-red-500 text-sm">
                      {errors.expenseDate.message}
                    </p>
                  )}
                </motion.div>

                {/* Recharge Details */}
                <motion.div
                  className="grid "
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  exit={slideUp.exit}
                >
                  {/* rechargeType selection  */}
                  <motion.div
                    className="space-y-2 my-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-md font-semibold">Recharge Type</p>
                    {["Wi-Fi", "Mobile", "Electricity"].map(
                      (item, index) => (
                        <div key={index} className="block">
                          <label className=" ">
                            <input
                              type="radio"
                              id="rechargeType"
                              value={item}
                              {...register("rechargeType", {
                                required:
                                  "At least one rechargeType is required!",
                              })}
                              className="mr-2 h-4 w-4 border-gray-300 rounded focus:ring-purple-500 accent-purple-500"
                            />
                            <span className="ml-2">{item}</span>
                          </label>
                        </div>
                      )
                    )}
                    <AnimatePresence>
                      {errors.rechargeType && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-500 text-sm"
                        >
                          {errors.rechargeType.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>

                {/* Mobile-specific fields */}
                <AnimatePresence>
                  {watchRechargeType === "Mobile" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 border-l-4 border-purple-500 pl-4 bg-purple-50 p-3 rounded-r-lg"
                    >
                      <h3 className="text-md font-semibold text-purple-700">Mobile Recharge Details</h3>
                      
                      {/* Phone Number */}
                      <motion.div
                        className="space-y-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className="block font-semibold">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="Enter 10-digit phone number"
                          {...register("phoneNumber", {
                            required: watchRechargeType === "Mobile" ? "Phone number is required" : false,
                            pattern: {
                              value: /^[0-9]{10}$/,
                              message: "Please enter a valid 10-digit phone number"
                            }
                          })}
                          className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none bg-white"
                        />
                        {errors.phoneNumber && (
                          <p className="text-red-500 text-sm">
                            {errors.phoneNumber.message}
                          </p>
                        )}
                      </motion.div>

                      {/* Plan Type */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-md font-semibold">Plan Type</p>
                        {["Prepaid", "Postpaid"].map((planType, index) => (
                          <div key={index} className="block">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value={planType}
                                {...register("planType", {
                                  required: watchRechargeType === "Mobile" ? "Plan type is required" : false,
                                })}
                                className="mr-2 h-4 w-4 border-gray-300 rounded focus:ring-purple-500 accent-purple-500"
                              />
                              <span className="ml-2">{planType}</span>
                            </label>
                          </div>
                        ))}
                        {errors.planType && (
                          <p className="text-red-500 text-sm">
                            {errors.planType.message}
                          </p>
                        )}
                      </motion.div>

                      {/* Bill Date From */}
                      <motion.div
                        className="space-y-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label className="block font-semibold">Bill Date From</label>
                        <Controller
                          control={control}
                          name="billDateFrom"
                          rules={{
                            required: watchRechargeType === "Mobile" ? "Bill date from is required" : false,
                          }}
                          render={({ field: { onChange, value } }) => (
                            <div className="relative w-full">
                              <DatePicker
                                selected={value}
                                onChange={onChange}
                                dateFormat="dd/MM/yyyy"
                                className="border p-2 rounded-md border-gray-400 w-full bg-white"
                                placeholderText="Select From Date"
                              />
                            </div>
                          )}
                        />
                        {errors.billDateFrom && (
                          <p className="text-red-500 text-sm">
                            {errors.billDateFrom.message}
                          </p>
                        )}
                      </motion.div>

                      {/* Bill Date To */}
                      <motion.div
                        className="space-y-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label className="block font-semibold">Bill Date To</label>
                        <Controller
                          control={control}
                          name="billDateTo"
                          rules={{
                            required: watchRechargeType === "Mobile" ? "Bill date to is required" : false,
                          }}
                          render={({ field: { onChange, value } }) => (
                            <div className="relative w-full">
                              <DatePicker
                                selected={value}
                                onChange={onChange}
                                dateFormat="dd/MM/yyyy"
                                className="border p-2 rounded-md border-gray-400 w-full bg-white"
                                placeholderText="Select To Date"
                              />
                            </div>
                          )}
                        />
                        {errors.billDateTo && (
                          <p className="text-red-500 text-sm">
                            {errors.billDateTo.message}
                          </p>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Amount */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="flex justify-between font-semibold">
                    Amount ₹
                  </label>
                  <input
                    placeholder="₹"
                    type="text"
                    {...register("amount", { required: "Amount required" })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                    min="0"
                    onKeyDown={(event) => {
                      if (
                        event.key === "ArrowUp" ||
                        event.key === "ArrowDown"
                      ) {
                        event.preventDefault();
                      }
                    }}
                  />
                </motion.div>

                {/* Description */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block font-semibold">Description</label>
                  <input
                    type="text"
                    {...register("description")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>
                
                {/* Remarks */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block font-semibold">Remarks</label>
                  <input
                    type="text"
                    {...register("remarks")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>

                {/* File Uploads */}
                <AntdFileUpload category={["Location", "Payment", "Invoice"]} />

               
                {/* Form Actions */}
                <motion.div
                  className="flex flex-col sm:flex-row justify-between gap-4 pt-4"
                  initial={fadeIn.hidden}
                  animate={fadeIn.visible}
                  exit={fadeIn.exit}
                >
                  <div className="space-x-4 ">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="bg-purple-600 text-white px-8 py-2 rounded-md font-semibold hover:bg-purple-700 relative"
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.span
                            className="block w-4 h-4 border-2 border-white rounded-full border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          />
                        </motion.div>
                      ) : (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Submit
                        </motion.span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.form>
          </div>
        </AnimatePresence>
      </div>
    </section>
  );
}