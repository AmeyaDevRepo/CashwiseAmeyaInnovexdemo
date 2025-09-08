import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AnimatePresence, motion } from "framer-motion";
import {
  useForm,
  SubmitHandler,
  Controller,
  FieldErrorsImpl,
} from "react-hook-form";
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
  todayWork: string;
  location: object;
  serviceProvider: string;
  fromDate: Date | null;
  toDate: Date | null;
  paymentDate: Date | null;
  amount: number;
  description: string;
  remarks: string;
  documentNo:string;
  labourTypes?: Record<string, number>;
  numberOfLabour?: Record<string, number>;
  rate?: Record<string, number>;
  [key: `rate.${string}`]: number;
  [key: `numberOfLabour.${string}`]: number;
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

export default function ToPayLabour({ closeModal }: expenseFormProps) {
  const user = useAppSelector(selectUser);
  const userLocation = useLocation();
  const path = usePathname();
    const files= useAppSelector(selectFiles)
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
      todayWork: "",
      location: userLocation,
      serviceProvider: "",
      fromDate: null,
      toDate: null,
      paymentDate: null,
      amount: 0,
      description: "",
      remarks: "",
      documentNo:"",
    },
  });

  const watchSiteName = watch("siteName");
  const watchServiceProvider = watch("serviceProvider");
  // const watchNumberOfLabour=watch('numberOfLabour')
  // const watchRate=watch('rate')
  useEffect(() => {
    async function allProducts() {
      try {
        const response = await client.get("/site/filtersite", {
          params: {
            siteName: watchSiteName,
          },
        });
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

  // Add this useEffect hook to your component
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      // Only calculate when relevant fields change
      if (
        name &&
        (name.startsWith("labourTypes") ||
          name.startsWith("numberOfLabour") ||
          name.startsWith("rate"))
      ) {
        const labourTypes = values.labourTypes || {};
        const numberOfLabour = values.numberOfLabour || {};
        const rate = values.rate || {};

        let totalAmount = 0;

        Object.keys(labourTypes).forEach((key) => {
          if (labourTypes[key]) {
            const q = Number(numberOfLabour[key]) || 0;
            const r = Number(rate[key]) || 0;
            totalAmount += q * r;
          }
        });

        // Only update if the value actually changed
        if (totalAmount !== values.amount) {
          setValue("amount", totalAmount, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // handle form name dynamically
  let tab = path.replace(/^\/|\/$/g, "");
  const tabParts = tab.split(/(?=[A-Z])/);
  tabParts[0] = tabParts[0].charAt(0).toUpperCase() + tabParts[0].slice(1);

  const onSubmit = async (data: FormValues) => {
    const formdata = new FormData();
    // Check if the user is not an admin and at least one file field is empty
      //  if (user.role !== "admin") {
      //    if (!data.paymentFiles || data.paymentFiles.length === 0) {
      //      if (data.amount > 500) {
      //        return toast.error("Paytm File is required!");
      //      }
      //      if (data.amount > 100) {
      //        return toast.error("At least one File is required!");
      //      }
      //    }
      //  }
    const labourDetails: any = [];
    const labourTypes = data.labourTypes || {};

    ["skilled", "semi-skilled", "un-skilled", "supervisor"].forEach((type) => {
      if (labourTypes[type]) {
        // Check if the type is selected
        labourDetails.push({
          type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
          numberOfLabour: data.numberOfLabour?.[type] || 0,
          rate: data.rate?.[type] || 0,
        });
      }
    });
    formdata.append("toPayLabour", "toPayLabour");
    formdata.append("schema", path);
    formdata.append("user", user.name);
    formdata.append("siteName", data.siteName);
    formdata.append("todayWork", data.todayWork);
    formdata.append("location", JSON.stringify(userLocation.currentLocation));
    formdata.append("serviceProvider", data.serviceProvider);
    formdata.append("labourDetails", JSON.stringify(labourDetails));
    formdata.append(
      "fromDate",
      data.fromDate ? data.fromDate.toISOString() : ""
    );
    formdata.append("toDate", data.toDate ? data.toDate.toISOString() : "");
    formdata.append("paymentDate", data.paymentDate ? data.paymentDate.toISOString() : "");

    formdata.append(
      "amount",
      data.amount !== null ? data.amount.toString() : ""
    );
    formdata.append("description", data.description);
    formdata.append("remarks", data.remarks);
    formdata.append("documentNo", data.documentNo);
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
        `/form/${user._id}/toPayLabour`,
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
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-purple-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-white text-2xl font-bold">
                    {tabParts[0]} {tabParts[1]}{" "}
                    {tabParts[2] ? tabParts[2] : null}
                    <br />{" "}
                    <span className="text-gray-300 text-sm ">Labour</span>{" "}
                    <br />
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <ImCross className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Site Selection */}
                {/* <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Site Name{" "}
                    <span className="text-gray-500">(जगह का नाम)</span>
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        {...register("siteName", {
                          required: "Site Name is Required",
                        })}
                        className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                        onFocus={() => setVisibleDropdown("siteName")}
                      />
                      <span className="mt-4 -translate-x-4">
                        <IoIosArrowDown />
                      </span>
                    </div>
                    {visibleDropdown === "siteName" && sites.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="p-2 bg-gray-50 flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Select site
                          </span>
                          <button
                            onClick={() => setVisibleDropdown(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <RxCross2 className="w-4 h-4" />
                          </button>
                        </div>
                        <ul className="max-h-40 overflow-auto">
                          {sites.map((site: any) => (
                            <li
                              key={site._id}
                              onClick={() => {
                                handleSiteClick(site);
                                setVisibleDropdown(null);
                              }}
                              className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                            >
                              {site.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {errors.siteName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.siteName.message as string}
                    </p>
                  )}
                </div> */}

                {/* Work Details */}
                {/* <motion.div
                  className="space-y-1"
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  exit={slideUp.exit}
                >
                  <label className="block text-sm font-medium text-gray-700">
                    Today&apos;s Work{" "}
                  </label>
                  <input
                    type="text"
                    {...register("todayWork")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div> */}

                {/* Service Provider */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Service Provider
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        {...register("serviceProvider", {
                          required: "Service Provider is Required",
                        })}
                        className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                        onFocus={() => setVisibleDropdown("serviceProvider")}
                      />
                      <span className="mt-4 -translate-x-4">
                        <IoIosArrowDown />
                      </span>
                    </div>
                    {visibleDropdown === "serviceProvider" &&
                      sites.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white shadow-lg rounded-lg overflow-hidden">
                          <div className="p-2 bg-gray-50 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Select provider
                            </span>
                            <button
                              onClick={() => setVisibleDropdown(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <RxCross2 className="w-4 h-4" />
                            </button>
                          </div>
                          <ul className="max-h-40 overflow-auto">
                            {userData.map(
                              (user: any) =>
                                user.role === "toPay" && (
                                  <li
                                    key={user._id}
                                    onClick={() => {
                                      handleServiceProviderClick(user);
                                      setVisibleDropdown(null);
                                    }}
                                    className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                                  >
                                    {user.name}
                                  </li>
                                )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      From Date
                    </label>
                    <Controller
                      name="fromDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          required
                          selected={field.value}
                          onChange={field.onChange}
                          dateFormat="dd MMM yyyy"
                          placeholderText="DD/MMM/YYYY"
                          className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      To Date
                    </label>
                    <Controller
                      name="toDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          required
                          selected={field.value}
                          onChange={field.onChange}
                          dateFormat="dd MMM yyyy"
                          placeholderText="DD/MMM/YYYY"
                          className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Labour Details */}
                <div>
                  <div className="grid grid-cols-3 gap-2 pb-2 text-center">
                    <p className="block text-sm font-medium text-gray-700">
                      Labour Type
                    </p>
                    <p className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                      No. of Labours
                    </p>
                    <p className="block text-sm font-medium text-gray-700">
                      Rate
                    </p>
                  </div>

                  {/* // Modify the input fields to include validation and error messages */}
                  {["Skilled", "Semi-Skilled", "Un-Skilled", "Supervisor"].map(
                    (type) => {
                      const labourTypeKey = type.toLowerCase();
                      return (
                        <div
                          key={type}
                          className="grid grid-cols-3 gap-2 pb-4 items-center"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value={type}
                              className="text-3xl p-2 accent-purple-500"
                              {...register(`labourTypes.${labourTypeKey}`)}
                            />
                            <label className="text-sm font-medium text-gray-700">
                              {type}
                            </label>
                          </div>

                          <div>
                            <input
                              type="text"
                              min="0"
                              {...register(`numberOfLabour.${labourTypeKey}`, {
                                validate: (value) => {
                                  const isChecked = getValues(
                                    `labourTypes.${labourTypeKey}`
                                  );
                                  if (isChecked) {
                                    return (
                                      value > 0 ||
                                      "Number is required for this labour type"
                                    );
                                  }
                                  return true;
                                },
                              })}
                              className="w-full px-2 border border-gray-400 rounded-md focus:border-purple-500 outline-none"
                              placeholder="0"
                            />
                            {(errors as any).numberOfLabour?.[
                              labourTypeKey
                            ] && (
                              <p className="text-red-500 text-sm mt-1">
                                {
                                  (errors as Record<string, any>)
                                    ?.numberOfLabour?.[labourTypeKey]?.message
                                }
                              </p>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              min="0"
                              {...register(`rate.${labourTypeKey}`, {
                                validate: (value) => {
                                  const isChecked = getValues(
                                    `labourTypes.${labourTypeKey}`
                                  );
                                  if (isChecked) {
                                    return (
                                      value > 0 ||
                                      "Rate is required for this labour type"
                                    );
                                  }
                                  return true;
                                },
                              })}
                              className="w-full px-2 border border-gray-400 rounded-md focus:border-purple-500 outline-none"
                              placeholder="AED"
                            />
                            {(errors as any).rate?.[labourTypeKey] && (
                              <p className="text-red-500 text-sm mt-1">
                                {
                                  (errors as Record<string, any>)?.rate?.[
                                    labourTypeKey
                                  ]?.message
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
                {/* Amount and payment */}
                <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount <span className="text-gray-500"></span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      min="0"
                      onKeyDown={(event) => {
                        if (
                          event.key === "ArrowUp" ||
                          event.key === "ArrowDown"
                        ) {
                          event.preventDefault();
                        }
                      }}
                      {...register("amount", { required: "Amount required" })}
                      className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                    <label className="block text-sm font-medium text-gray-700 w-full">
                      Payment Date
                    </label>
                    <Controller
                      name="paymentDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          required
                          selected={field.value}
                          onChange={field.onChange}
                          dateFormat="dd MMM yyyy"
                          placeholderText="DD/MMM/YYYY"
                          className="w-auto p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                        />
                      )}
                    />
                  </div>
                  </div>
                {/* description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description <span className="text-gray-500"></span>
                  </label>
                  <input
                    type="text"
                    {...register("description")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </div>
                {/* remarks */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Remarks <span className="text-gray-500"></span>
                  </label>
                  <input
                    type="text"
                    {...register("remarks")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </div>
 {path && path === "/toPayExpense" && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block font-semibold">Document Number</label>
                  <input
                    type="text"
                    {...register("documentNo")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>
                )}
                {/* File Uploads */}
                <AntdFileUpload category={["Location","Payment","Invoice"]} />

                {/* Notice Section */}
                <motion.div
                  className="bg-red-50 p-4 rounded-lg"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="text-md font-bold mb-2">NOTICE</h3>
                  <p className="text-red-600 font-semibold">
                    Form को Submit करने से पहले अपने खर्च का हिसाब-किताब अच्छी
                    तरह जांच लें क्यूंकि एक बार Submit करने बाद Form को Edit
                    नहीं किया जा सकता।
                  </p>
                </motion.div>

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
