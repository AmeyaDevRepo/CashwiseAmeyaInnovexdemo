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
  purposeOfLabour: string;
  masterLabourName: string;
  masterLabourNumber: number | null;
  numberOfLabour: number;
  amount: number;
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

export default function DailyWages({ closeModal }: expenseFormProps) {
  const user = useAppSelector(selectUser);
  const userLocation = useLocation();
    const files= useAppSelector(selectFiles)
  const path = usePathname();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const Error = (data: any) => toast.error(data);
  const Success = (data: any) => toast.success(data);
  const [sites, setSites] = useState<SiteInterface[]>([]);
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
      purposeOfLabour: "",
      masterLabourName: "",
      masterLabourNumber: null,
      numberOfLabour: 0,
      amount: 0,
      description: "",
      remarks: "",
    },
  });

  const watchSiteName = watch("siteName");
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

  // handle form name dynamically
  let tab = path.replace(/^\/|\/$/g, "");
  const tabParts = tab.split(/(?=[A-Z])/);
  tabParts[0] = tabParts[0].charAt(0).toUpperCase() + tabParts[0].slice(1);

  const onSubmit = async (data: FormValues) => {
    const formdata = new FormData();
     // Check if the user is not an admin and at least one file field is empty
     if (user.role !== "admin") {
      if (!files.Payment || files.Payment.length === 0) {
        if (data.amount > 500) {
          return toast.error("Paytm File is required!");
        }
        if (data.amount > 100) {
          return toast.error("At least one File is required!");
        }
      }
    }
    formdata.append("dailyWages", "dailyWages");
    formdata.append("schema", path);
    formdata.append("user", user.name);
    formdata.append("siteName", data.siteName);
    formdata.append("todayWork", data.todayWork);
    formdata.append("location", JSON.stringify(userLocation.currentLocation));
    formdata.append("purposeOfLabour", data.purposeOfLabour);
    formdata.append("masterLabourName", data.masterLabourName);
    formdata.append(
      "masterLabourNumber",
      data.masterLabourNumber ? data.masterLabourNumber.toString() : ""
    );
    formdata.append(
      "numberOfLabour",
      data.numberOfLabour !== null ? data.numberOfLabour.toString() : ""
    );
    formdata.append(
      "amount",
      data.amount !== null ? data.amount.toString() : ""
    );
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
        `/form/${user._id}/dailyWages`,
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
                  <span className="text-gray-300 text-sm ">Daily Wages</span>{" "}
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
                <motion.div
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
                        className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
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
                </motion.div>

                {/* Work Details */}
                <motion.div
                  className="space-y-1"
                  initial={slideUp.hidden}
                  animate={slideUp.visible}
                  exit={slideUp.exit}
                >
                  <label className="block text-md font-semibold">
                    Today&apos;s Work (आज का कार्य)
                  </label>
                  <input
                    {...register("todayWork")}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>

                {/* labour Details */}

                {/* purpose of labour */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block font-semibold">
                    Purpose of Labour{" "}
                  </label>
                  <input
                    type="text"
                    {...register("purposeOfLabour", {
                      required: "Purpose of Labour required!",
                    })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>
                {/* name of master labour */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block font-semibold">
                    Master Labour Name{" "}
                  </label>
                  <input
                    type="text"
                    {...register("masterLabourName", {
                      required: "Number of Master Labour required!",
                    })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>
                {/* master labour number */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block font-semibold">
                  Master Labour Mob No
                  </label>
                  <input
                    type="tel"
                    {...register("masterLabourNumber", {
                      required: "Mater labour Number required!",
                    })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>
                {/* Restaurant phone number */}

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block font-semibold">
                    Number Of Labour
                  </label>
                  <input
                    type="tel"
                    {...register("numberOfLabour", {
                      required: "Labour Numbers required!",
                    })}
                    className="w-full p-2 border-b-2 border-gray-200 focus:border-purple-500 outline-none"
                  />
                </motion.div>
                {/* labour amount */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block font-semibold">Amount ₹</label>
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
                {/* labour Description */}
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
                {/* labour remarks */}
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
