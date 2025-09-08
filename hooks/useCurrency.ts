"use client";
import { useState, useEffect, useCallback } from "react";
import client from "@createRequest";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@redux/redux.hooks";
import { selectUser } from "@redux/users/userSlice";
import { setCurrency as setCurrencyAction, selectCurrency } from "@redux/currency/currencySlice";

type UseCurrencyReturn = {
  currency: {
    _id: string | null;
    name: string;
    symbol: string;
    code: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  refreshCurrency: () => void;
};

export default function useCurrency(): UseCurrencyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAppSelector(selectUser);
  const userId = user?._id;

  const currency = useAppSelector(selectCurrency); // read currency directly from Redux
  const dispatch = useAppDispatch();

  const fetchCurrency = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await client.get("/saveCurrency", {
        params: { userId },
      });
      console.log("Fetch currency response:", response);

      if (response.status === 200) {
        const savedCurrency = (response as any)?.data?.currencies?.[0] || null;
console.log("savedCurrency",savedCurrency)
        if (savedCurrency) {
          dispatch(setCurrencyAction(savedCurrency)); // save to redux
          console.log("Fetched currency:", savedCurrency);
        }
        setError(null);
      } else {
        setError("Failed to fetch currency");
        toast.error("Failed to fetch currency");
      }
    } catch (err) {
      console.error("Error fetching currency:", err);
      setError("Error fetching currency");
      toast.error("Error fetching currency");
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchCurrency();
  }, [fetchCurrency]);

  return { currency, isLoading, error, refreshCurrency: fetchCurrency };
}
