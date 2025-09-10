"use client";
import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import Logo from "@app/_images/white_ameya_logo.png";
import darkLogo from "@app/_images/image (5).png";
import Photo from "@app/_images/cashwisePhoto.png";
import intertechlogo from "@app/_images/Intertech-removebg-preview.png";
import { toast } from "react-toastify";
import { redirect, usePathname, useRouter } from "next/navigation";
import Loader from "@app/_components/Loader";
import { setCookie } from "cookies-next";

import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "@node_modules/react-icons/ai";
import client from "@createRequest";
import { useAppDispatch, useAppSelector } from "@redux/redux.hooks";
import { selectUser, setUser } from "@redux/users/userSlice";
import { getCookie } from "cookies-next";
const Login = () => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
  } = useForm();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector(selectUser);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = getCookie("accessToken");
      const role = getCookie("role");

      if (accessToken && role) {
        const path =
          role === "admin"
            ? "/admin/account"
            : `/users/expenses/${user?._id ?? ""}`;
        // router.push(path);
        // router.refresh();
        window.location.replace(path);
      }
    };

    checkAuth();
  }, [router, user?._id]);

  const handleSendOtp = async () => {
    const phone = getValues("phone");
    if (!phone || phone.toString().length !== 10) {
      toast.error("Please enter valid phone number");
      return;
    }
    try {
      setIsLoading(true);
      const res = await client.put("/login", { phone });
      if (res.status === 200) {
        toast.success("OTP sent successfully");
        setOtpSent(true);
      }
    } catch (error) {
      toast.error(
        (error as any)?.response?.data?.message || "Failed to send OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      let response: any;

      if (loginMethod === "email") {
        response = await client.post("/login", {
          email: data.email,
          password: data.password,
        });
      } else {
        response = await client.post("/login", {
          phone: data.phone,
          otp: data.otp,
        });
      }

      if (response.status === 200) {
        dispatch(setUser(response.data?.user));
        const UserRole = response.data?.user?.role;
        localStorage.setItem("accessToken", response?.data?.accessToken);
        localStorage.setItem("role", UserRole);
        setCookie("accessToken", response?.data?.accessToken);
        setCookie("role", UserRole);

        const path =
          UserRole === "admin"
            ? "/admin/account"
            : `/users/expenses/${response.data?.user?._id}`;
        toast.success(response?.data?.message);
        // router.push(path);
        // router.refresh();
        window.location.replace(path);
      }
    } catch (error) {
      toast.error(
        (error as any)?.response?.data?.message || "Authentication failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen lg:h-screen py-5 lg:py-0 justify-end lg:justify-start flex lg:flex-row flex-col-reverse lg:gap-5 bg-[#ffffff] dark:bg-slate-950 overflow-hidden">
      {isLoading && <Loader />}
      <div className="bg-transparent overflow-x-hidden w-11/12 mx-auto lg:w-[48%] flex flex-row justify-center lg:items-center">
        <div className="w-full lg:w-[58%]">
          <div className="flex-col hidden lg:flex gap-y-5 mb-4">
            <div className="hidden lg:block lg:pb-8">
              <div className="flex justify-between border-b-2 shadow-xl">
                <Image
                  src={isDarkMode ? darkLogo : Logo}
                  alt="Logo"
                  height={90}
                  width={90}
                />
                {/*                 <Image
                  src={intertechlogo}
                  alt="Logo"
                  height={100}
                  width={130}
                /> */}
              </div>
              <div className="flex flex-col">
                <h4 className="text-2xl text-center dark:text-white border-b font-bold mt-4 font-serif">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                    CashWise
                  </span>
                </h4>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-y-3 lg:gap-y-6"
          >
            {/*
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`w-full py-2 rounded-md font-semibold transition-colors ${
                  loginMethod === "email"
                    ? "bg-gradient-to-r from-blue-600 to-purple-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("phone");
                  setOtpSent(false);
                }}
                className={`w-full py-2 rounded-md font-semibold transition-colors ${
                  loginMethod === "phone"
                    ? "bg-gradient-to-r from-blue-600 to-purple-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Phone Login
              </button> 
          
</div>
  */}
            {loginMethod === "email" ? (
              <>
                <div className="flex flex-col gap-y-1 w-full">
                  <p className="text-xs font-semibold px-1">Email</p>
                  <input
                    type="email"
                    {...register("email", { required: true })}
                    placeholder="abc@gmail.com"
                    className="border-gray-400 text-sm border-[1px] rounded-md pl-4 py-2 focus-visible:outline-[#014db7!important] dark:text-black"
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs mt-1">
                      Email is required
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-y-1 w-full">
                  <div className="text-xs font-semibold px-1 flex justify-between">
                    <p>Password</p>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", { required: true })}
                      placeholder="Enter Your Password"
                      className="border-gray-400 dark:text-black text-sm border-[1px] rounded-md pl-4 py-2 w-full focus-visible:outline-[#014db7!important]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <AiOutlineEye />
                      ) : (
                        <AiOutlineEyeInvisible />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-500 text-xs mt-1">
                      Password is required
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-y-1 w-full">
                  <p className="text-xs font-semibold px-1">Phone Number</p>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      {...register("phone", { required: true })}
                      placeholder="Enter your phone number"
                      className="border-gray-400 text-sm border-[1px] rounded-md pl-4 py-2 flex-1 focus-visible:outline-[#014db7!important] dark:text-black"
                    />
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                        disabled={isLoading}
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                  {errors.phone && (
                    <span className="text-red-500 text-xs mt-1">
                      Phone number is required
                    </span>
                  )}
                </div>
                {otpSent && (
                  <div className="flex flex-col gap-y-1 w-full">
                    <p className="text-xs font-semibold px-1">OTP</p>
                    <input
                      type="number"
                      {...register("otp", { required: true })}
                      placeholder="Enter OTP"
                      className="border-gray-400 text-sm border-[1px] rounded-md pl-4 py-2 focus-visible:outline-[#014db7!important] dark:text-black"
                    />
                    {errors.otp && (
                      <span className="text-red-500 text-xs mt-1">
                        OTP is required
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (loginMethod === "phone" && !otpSent)}
              className={`flex items-center justify-center gap-2 text-white font-semibold w-full py-2 mb-8 rounded-md transition-opacity ${
                isLoading || (loginMethod === "phone" && !otpSent)
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-500 hover:opacity-90"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Processing...
                </>
              ) : loginMethod === "email" ? (
                "Sign In"
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="w-11/12 lg:w-[45%] mx-auto flex flex-col items-center rounded-xl">
        <div className="lg:hidden block mx-auto">
          <div className="flex justify-between border-b-2 shadow-xl px-2">
            <Image
              src={isDarkMode ? darkLogo : Logo}
              alt="Logo"
              height={90}
              width={90}
            />
            {/*             <Image src={intertechlogo} alt="Logo" height={100} width={150} /> */}
          </div>
          <h4 className="text-2xl text-center dark:text-white border-b-2 font-bold mt-4 font-serif">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              CashWise
            </span>
          </h4>
        </div>
        <Image
          src={Photo}
          alt="Task"
          className="lg:h-full p-3 lg:w-full w-5/6 h-4/6 rounded-2xl object-cover"
          priority
        />
      </div>
    </div>
  );
};

export default Login;
