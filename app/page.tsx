"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { IoIosRefresh } from "react-icons/io";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push("/login");
  }, [router]);
  return (
    <main className="w-screen h-screen overflow-hidden flex justify-center items-center">
      <div className="flex flex-col gap-4">
      <h1 className="font-semibold text-sm text-red-600">
        Please wait redirecting to login page
      </h1>
      <p>OR</p>
      <button className="p-2 bg-blue-500 rounded-lg shadow-lg text-white"  onClick={()=>{window.location.reload()}}><IoIosRefresh/>  Refresh</button>
      </div>
    </main>
  );
}
