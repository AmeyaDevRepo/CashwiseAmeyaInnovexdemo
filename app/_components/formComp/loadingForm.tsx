import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AnimatePresence, motion } from "framer-motion";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
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
import { IoIosArrowDown } from "react-icons/io";
import { IUsers } from "@app/_interface/user.interface";
import { selectFiles } from "@redux/files/filesSlice";
import AntdFileUpload from "../AntdUpload";

// modal handle
type expenseFormProps = {
  closeModal: () => void;
};

type FormValues = {
  siteName: string;
  todayWork: string;
  location: object;
  serviceProvider: string;
  workType: string;
  material: string;
  masterLabourName: string;
  loadingTypes?: Record<string, number>;
  quantity?: Record<string, number>;
  rate?: Record<string, number>;
  [key: `rate.${string}`]: number;
  [key: `quantity.${string}`]: number;
  amount: number;
  description: string;
  remarks: string;
  documentNo:string;
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

export default function LoadingForm({ closeModal }: expenseFormProps) {
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
      workType: "",
      material: "",
      masterLabourName: "",
      amount: 0,
      description: "",
      remarks: "",
      documentNo:"",
    },
  });

  const watchSiteName = watch("siteName");
  const watchServiceProvider = watch("serviceProvider");

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

  // Add this useEffect hook to your component
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      // Only calculate when relevant fields change
      if (
        name &&
        (name.startsWith("loadingTypes") ||
          name.startsWith("quantity") ||
          name.startsWith("rate"))
      ) {
        const loadingTypes = values.loadingTypes || {};
        const quantity = values.quantity || {};
        const rate = values.rate || {};

        let totalAmount = 0;

        Object.keys(loadingTypes).forEach((key) => {
          if (loadingTypes[key]) {
            const q = Number(quantity[key]) || 0;
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

  const onSubmit = async (data: FormValues) => {
    const formdata = new FormData();
    // Check if the user is not an admin and at least one file field is empty
    if (user.role !== "admin" && path !== "/toPayExpense") {
      if (!files.Payment || files.Payment.length === 0) {
           if (data.amount > 500) {
             return toast.error("Paytm File is required!");
           }
           if (data.amount > 100) {
             return toast.error("At least one File is required!");
           }
         }
       }
    const loadingDetails: any = [];
    const loadingTypes = data.loadingTypes || {};

    ["50kg", "25kg", "10kg", "other"].forEach((type) => {
      if (loadingTypes[type]) {
        // Check if the type is selected
        loadingDetails.push({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          quantity: data.quantity?.[type] || 0,
          rate: data.rate?.[type] || 0,
        });
      }
    });
    formdata.append("loading", "loading");
    formdata.append("schema", path);
    formdata.append("user", user.name);
    formdata.append("siteName", data.siteName);
    formdata.append("todayWork", data.todayWork);
    formdata.append("location", JSON.stringify(userLocation.currentLocation));
    formdata.append("serviceProvider", data.serviceProvider);
    formdata.append("loadingDetails", JSON.stringify(loadingDetails));
    formdata.append("workType", data.workType);
    formdata.append("material", data.material);
    formdata.append("masterLabourName", data.masterLabourName);
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
        `/form/${user._id}/loading`,
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
                  {tabParts[0]} {tabParts[1]} {tabParts[1] ? tabParts[2] : null}
                  <br />{" "}
                  <span className="text-gray-300 text-sm ">
                    Loading/Un-Loading
                  </span>{" "}
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
                {/* Site Selection */}
                {/* <motion.div
                  className="space-y-1"
                  initial={fadeIn.hidden}
                  animate={fadeIn.visible}
                  exit={fadeIn.exit}
                >
                  <label className="block text-md font-semibold">
                    Site Name (जगह का नाम)
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        {...register("siteName", {
                          required: "Site Name is Required",
                        })}
                        className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                        onFocus={() => setVisibleDropdown("siteName")}
                      />
                      <span className="mt-4 -translate-x-4">
                        <IoIosArrowDown />
                      </span>
                    </div>
                    {visibleDropdown === "siteName" && sites.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md">
                        <div className="p-2 border-b flex justify-end bg-gray-200">
                          <RxCross2
                            className="text-red-400 cursor-pointer text-xl"
                            onClick={() => setVisibleDropdown(null)}
                          />
                        </div>
                        <ul className="max-h-40 overflow-auto bg-gray-200">
                          {sites.map((site: any) => (
                            <li
                              key={site._id}
                              onClick={() => {
                                handleSiteClick(site);
                                setVisibleDropdown(null);
                              }}
                              className="p-2 hover:bg-gray-300 cursor-pointer"
                            >
                              {site.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {errors.siteName && (
                    <p className="text-red-500 text-sm">
                      {errors.siteName.message as string}
                    </p>
                  )}
                </motion.div> */}

                {/* Work Details */}
                {/* <motion.div
                  className="space-y-1"
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  exit={slideUp.exit}
                >
                  <label className="block text-md font-semibold">
                    Today&apos;s Work
                  </label>
                  <input
                    {...register("todayWork")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div> */}

                {/* Service Provider */}
                {path && path === "/toPayExpense" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium ">
                      Service Provider
                    </label>
                    <div className="relative">
                      <div className="flex items-center">
                        <input
                          {...register("serviceProvider", {
                            required: "Service Provider is Required",
                          })}
                          className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
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
                                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
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
                )}
                {/* loading Details */}
                <motion.div
                  className="grid "
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  exit={slideUp.exit}
                >
                  {/* meal of loading  */}
                  <motion.div
                    className="space-y-2 my-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-md font-semibold">Type of Work</p>
                    {["Loading", "Un-Loading"].map((item, index) => (
                      <div key={index} className="block">
                        <label className=" ">
                          <input
                            type="radio"
                            id="workType"
                            value={item}
                            {...register("workType", {
                              required: "Work Type is required!",
                            })}
                            className="mr-2 h-4 w-4 border-gray-300 rounded focus:ring-blue-500 accent-blue-500"
                          />
                          <span className="ml-2">{item}</span>
                        </label>
                      </div>
                    ))}
                    <AnimatePresence>
                      {errors.workType && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-500 text-sm"
                        >
                          {errors.workType.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
                {/* Number of Persons */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block font-semibold">Work Material </label>
                  <input
                    type="text"
                    {...register("material", {
                      required: "Work Material required!",
                    })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div>
                {/* Name of Restaurant */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block font-semibold">
                    Name of Master Labour
                  </label>
                  <input
                    type="text"
                    {...register("masterLabourName", {
                      required: "Master labour name required!",
                    })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div>
                {/*Number of Packages  and rate*/}

                {/* work type Details */}
                <div>
                  <div className="grid grid-cols-3 gap-2 pb-2 text-center">
                    <p className="block text-sm font-medium text-gray-700 text-start">
                      Package Type
                    </p>
                    <p className="block text-sm font-medium text-gray-700 whitespace-nowrap ">
                      No.Of Boxes
                    </p>
                    <p className="block text-sm font-medium text-gray-700 ">
                      Rate
                    </p>
                  </div>

                  {/* // Modify the input fields to include validation and error messages */}
                  {["50KG", "25KG", "10KG", "Other"].map((type) => {
                    const loadingTypeKey = type.toLowerCase();
                    return (
                      <div
                        key={type}
                        className="grid grid-cols-3 gap-2 pb-4 items-center"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={type}
                            className="text-3xl p-2 accent-blue-500"
                            {...register(`loadingTypes.${loadingTypeKey}`)}
                          />
                          <label className="text-sm font-medium text-gray-700">
                            {type}
                          </label>
                        </div>

                        <div>
                          <input
                            type="text"
                            min="0"
                            {...register(`quantity.${loadingTypeKey}`, {
                              validate: (value) => {
                                const isChecked = getValues(
                                  `loadingTypes.${loadingTypeKey}`
                                );
                                if (isChecked) {
                                  return (
                                    value > 0 ||
                                    "Number is required for this work type"
                                  );
                                }
                                return true;
                              },
                            })}
                            className="w-full px-2 border border-gray-400 rounded-md focus:border-blue-500 outline-none"
                            placeholder="0"
                          />
                          {(errors as any).quantity?.[loadingTypeKey] && (
                            <p className="text-red-500 text-sm mt-1">
                              {
                                (errors as Record<string, any>)?.quantity?.[
                                  loadingTypeKey
                                ]?.message
                              }
                            </p>
                          )}
                        </div>

                        <div>
                          <input
                            type="number"
                            min="0"
                            {...register(`rate.${loadingTypeKey}`, {
                              validate: (value) => {
                                const isChecked = getValues(
                                  `loadingTypes.${loadingTypeKey}`
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
                            className="w-full px-2 border border-gray-400 rounded-md focus:border-blue-500 outline-none"
                            placeholder="AED"
                          />
                          {(errors as any).rate?.[loadingTypeKey] && (
                            <p className="text-red-500 text-sm mt-1">
                              {
                                (errors as Record<string, any>)?.rate?.[
                                  loadingTypeKey
                                ]?.message
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* amount */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block font-semibold">Amount AED</label>
                  <input
                    placeholder="AED"
                    type="amount"
                    min="0"
                    {...register("amount", { required: "Amount required" })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div>
                {/*  Description */}
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
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div>
                {/*  Description */}
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
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div>
                 {/* document no */}

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
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                  />
                </motion.div>
                )}
                {/* File Uploads */}
               <AntdFileUpload category={["Location","Payment","Invoice"]} />

                {/* Notice Section */}
               

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
                      className="bg-blue-600 text-white px-8 py-2 rounded-md font-semibold hover:bg-blue-700 relative"
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
