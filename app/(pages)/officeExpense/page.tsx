"use client";
import Sidebar from "@app/_components/Sidebar";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@redux/redux.hooks";
import { selectUser } from "../../../redux/users/userSlice";
import Cartage from "@app/_components/formComp/cartage";
import DailyWages from "@app/_components/formComp/dailyWages";
import Hotel from "@app/_components/formComp/hotel";
import LoadingForm from "@app/_components/formComp/loadingForm";
import Miscellaneous from "@app/_components/formComp/miscellaneous";
import Porter from "@app/_components/formComp/porter";
import Rider from "@app/_components/formComp/rider";
import Courier from "@app/_components/formComp/Courier";
import FoodWithStaff from "@app/_components/formComp/FoodwithStaff";
import Transport from "@app/_components/formComp/Transport";
import Maintenance from "@app/_components/formComp/Maintenance";
import Labour from "@app/_components/formComp/Labour";
import Conveyance from "@app/_components/formComp/conveyance";
import Food from "@app/_components/formComp/food";
import Purchase from "@app/_components/formComp/purchase";
import Tea from "@app/_components/formComp/Tea";
import Other from "@app/_components/formComp/other";
import client from "@createRequest";
import { useRouter } from "next/navigation";
import { clearArrayFiles } from "@redux/files/filesSlice";
import Recharge from "@app/_components/formComp/Recharge";

export default function TravelForm() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [modal, setModal] = useState<string | null>(null);

  useEffect(() => {
    const calculateMoney = async () => {
      try {
        const response = await client.get(`/users/${user._id}`);
        const userData = (response as any)?.data?.result as any;
        let totalOfficeCreditMoney = 0;
        let totalOfficeDebitMoney = 0;
        let totalTravelCreditMoney = 0;
        let totalTravelDebitMoney = 0;
        let totalOtherCreditMoney = 0;
        let totalOtherDebitMoney = 0;

        // Calculate total credit money based on reason
        (userData[0].credit || []).forEach((creditItem: any) => {
          creditItem.transactionDetails.forEach((transaction: any) => {
            if (transaction.reason === "office") {
              totalOfficeCreditMoney += transaction.money || 0;
            } else if (transaction.reason === "travel") {
              totalTravelCreditMoney += transaction.money || 0;
            } else {
              totalOtherCreditMoney += transaction.money || 0;
            }
          });
        });

        // Calculate total debit money based on reason
        (userData[0].debit || []).forEach((debitItem: any) => {
          debitItem.transactionDetails.forEach((transaction: any) => {
            if (transaction.reason === "office") {
              totalOfficeDebitMoney += transaction.money || 0;
            } else if (transaction.reason === "travel") {
              totalTravelDebitMoney += transaction.money || 0;
            } else {
              totalOtherDebitMoney += transaction.money || 0;
            }
          });
        });

        // Calculate balances
        const balanceOffice = totalOfficeCreditMoney - totalOfficeDebitMoney;
        const balanceTravel = totalTravelCreditMoney - totalTravelDebitMoney;
        const balanceOther = totalOtherCreditMoney - totalOtherDebitMoney;
        setBalance(balanceOffice + balanceTravel + balanceOther);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // You can set an error state here if needed
        setModal("Please Refresh Page to load data!");
      }
    };

    if (user && user._id) {
      calculateMoney();
    }
  }, [user]);
  const openModal = (item: string) => {
    dispatch(clearArrayFiles());
    setModal(item);
  };

  const closeModal = () => {
    dispatch(clearArrayFiles());
    setModal(null);

    router.refresh();
  };

  return (
    <section className="flex max-h-screen my-12 md:my-0 w-full">
      <Sidebar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden w-full py-4"
      >
        <div className="flex justify-between my-2 shadow-md p-2 ">
          <div className="p-2">
            <h2 className="text-xl">Date </h2>
            <p className="text-purple-500">
              [{new Date().toLocaleDateString()}]
            </p>
          </div>
          <div className="hidden md:block">
            <h2 className="text-xl">CashWise Expenses for Office</h2>
          </div>
          <div className="p-2">
            <h2 className="text-xl">Balance</h2>
            <p
              className={`text-center ${
                balance > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              [{balance}]
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-2 md:px-4 text-sm">
          {[
            "Conveyance",
            "Purchase",
            "Food",
            "Tea",
            // 'Ticket',
            "Hotel",
            "Labour",
            "Courier",
            "Recharge",
            // "Food with Staff",
            "Loading/Un-Loading",
            "Porter",
            "Cartage",
            "Rider",
            "Daily Wages",
            "Transport",
            "Maintenance",
            "Other",
            // "Miscellaneous",
          ].map((item, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: index * 0.03,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal(item)}
              className="text-white bg-gradient-to-r from-purple-600 to-blue-500 p-2 shadow-md rounded-md hover:shadow-lg transition-shadow"
            >
              {item}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Modal for ConveyanceOne */}
      {modal === "Conveyance" && <Conveyance closeModal={closeModal} />}
      {modal === "Cartage" && <Cartage closeModal={closeModal} />}
      {modal === "DailyWages" && <DailyWages closeModal={closeModal} />}
      {modal === "Food" && <Food closeModal={closeModal} />}
      {modal === "Hotel" && <Hotel closeModal={closeModal} />}
      {modal === "Loading/Un-Loading" && (
        <LoadingForm closeModal={closeModal} />
      )}
      {modal === "Miscellaneous" && <Miscellaneous closeModal={closeModal} />}
      {modal === "Other" && <Other closeModal={closeModal} />}
      {modal === "Purchase" && <Purchase closeModal={closeModal} />}
      {modal === "Recharge" && <Recharge closeModal={closeModal} />}
      {modal === "Porter" && <Porter closeModal={closeModal} />}
      {modal === "Rider" && <Rider closeModal={closeModal} />}
      {modal === "Daily Wages" && <DailyWages closeModal={closeModal} />}
      {modal === "Courier" && <Courier closeModal={closeModal} />}
      {modal === "Food with Staff" && <FoodWithStaff closeModal={closeModal} />}
      {modal === "Transport" && <Transport closeModal={closeModal} />}
      {modal === "Maintenance" && <Maintenance closeModal={closeModal} />}
      {modal === "Tea" && <Tea closeModal={closeModal} />}
      {modal === "Labour" && <Labour closeModal={closeModal} />}
    </section>
  );
}
