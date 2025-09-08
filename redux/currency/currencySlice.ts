import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// Define the initial state using that type
const initialState = {
  _id: null,
  name: "",
  symbol: "",
  code: "",
};
       
export const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<any>) => {
        console.log("action data",action.payload)
      return { ...action.payload }; // Set the user data
    },
    clearCurrency: () => initialState, // Reset user state to initial state
  },
});

export const { setCurrency, clearCurrency } = currencySlice.actions;

// Selector for getting user state
export const selectCurrency = (state: RootState) => state.currency;

export default currencySlice.reducer;
