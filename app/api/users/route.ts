export const maxDuration = 60;
import DB from "@app/_database/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { toast } from "react-toastify";
import hash from "bcrypt";
import Users from "@app/_model/user.model";

// Initialize database connection
(async function initializeDB() {
  await DB();
})();

// email validation function
function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
// function to create new user by admin
export async function POST(req: NextRequest) {
  const userHeader = req.headers.get("user");
  const authUser: any = userHeader ? JSON.parse(userHeader) : null;
  if (authUser?.role !== "admin" && authUser?.role !== "manager") {
    return NextResponse.json(
      {
        type: "BAD_REQUEST",
        message: "You are not authorized to create user",
      },
      { status: 403 }
    );
  }
  try {
    // get the request body
    const { _id, name, email, password, role, phone, type } = await req.json();
    // check if all fields are provided
    if (!name || !name.trim(" ") || !role) {
      // error message handle
      return NextResponse.json(
        {
          type: "BAD_REQUEST",
          message: "All fields are required !",
        },
        { status: 400 }
      );
    }
    // phone number validation
    // Validate the phone numbers
    if (phone.toString().length !== 10) {
      return NextResponse.json(
        { type: "BAD_REQUEST", message: "Phone number should be 10 digits." },
        { status: 400 }
      );
    }
    // email validation
    if (email && !validateEmail(email)) {
      return NextResponse.json(
        {
          type: "BAD_REQUEST",
          message: "Invalid email address",
        },
        { status: 400 }
      );
    }
    let hashedPassword: any = "";
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    // check if user not exists
    if (!_id) {
      const user = new Users({
        name,
        email: email ?? "",
        password: password ? hashedPassword : "",
        role,
        phone,
      });
      const result = await user.save();
      return NextResponse.json(
        {
          type: "SUCCESS",
          message: "User created successfully",
          result,
        },
        { status: 201 }
      );
    } else {
      const user = await Users.updateOne(
        { _id },
        { name, email, password: hashedPassword, role, phone },
        { new: true }
      );
      if (!user) {
        return NextResponse.json(
          {
            type: "BAD_REQUEST",
            message: "Failed to updated user",
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        {
          type: "SUCCESS",
          message: "User updated successfully",
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    // errror handle
    console.log(error.message);
    return NextResponse.json(
      {
        type: "ERROR",
        message: error.message || "Something went wrong!",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const userHeader = req.headers.get("user");
  const authUser: any = userHeader ? JSON.parse(userHeader) : null;
  if (authUser?.role !== "admin" && authUser?.role !== "manager") {
    return NextResponse.json(
      {
        type: "BAD_REQUEST",
        message: "You are not authorized to create user",
      },
      { status: 403 }
    );
  }
  try {
    const searchUrl = new URL(req.url);
    const name = searchUrl.searchParams.get("name") || "";
    const role = searchUrl.searchParams.get("role") || "";
    const type = searchUrl.searchParams.get("type") || "";
    const filterQuery: {
      name?: string | { $regex: string; $options: string };
      role?: string;
      type?: string;
    } = {};
    if (name && name.trim()) {
      filterQuery.name = { $regex: name, $options: "i" };
    }
    if (role && role.trim()) {
      filterQuery.role = role;
    }
    if (type && type.trim()) {
      filterQuery.type = type;
    }
    const users = await Users.find(filterQuery);
    if (!users) {
      return NextResponse.json(
        {
          type: "BAD_REQUEST",
          message: "User not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      {
        type: "BAD_REQUEST",
        message: "Something went wrong!",
      },
      { status: 500 }
    );
  }
}

// export async function GET() {
//     try {
//         const users = await Users.find();
//         const result = await Promise.all(users.map(async (user) => {
//             const expenses = await ExpenseModel.find({ createdBy: user._id });
//             const totalAdvanced = expenses.reduce((sum, expense) => sum + (expense.advancedReceived || 0), 0);
//             const totalExpense = expenses.reduce((sum, expense) => {
//                 const conveyance = expense.conveyance?.amount || 0
//                 const conveyance2 = expense.conveyance2?.amount || 0;
//                 const foodExpense = expense.foodExpense?.amount || 0;
//                 const hotel = expense.hotel?.amount || 0;
//                 const labour = expense.labour?.amount || 0;
//                 const otherExpense = expense.otherExpense?.amount || 0;
//                 const purchase = expense.purchase?.amount || 0;
//                 const purchase2 = expense.purchase2?.amount || 0;
//                 const teaFood = expense.teaFood?.amount || 0;
//                 const fuel = expense.fuel?.total || 0;
//                 return sum + foodExpense + hotel + labour + otherExpense + purchase + purchase2 + teaFood + fuel+ conveyance + conveyance2;
//             }, 0);
//             // Add calculated fields to user object
//              let balance=0
//              let openingBalance=balance + totalAdvanced - totalExpense
//              balance=balance + openingBalance
//             return {
//                 ...user.toObject(),
//                 totalAdvanced,
//                 totalExpense,
//                 balance,
//                 openingBalance
//             };
//         }));

//         return NextResponse.json(result);
//     } catch (error) {
//         // console.error(error);
//         return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
//     }
// }

// export async function PUT(req:NextRequest) {
//     try {
//         // Get the user ID from the query parameters
//         const { searchParams } = new URL(req.url);
//         const userId = searchParams.get('id');

//         if (!userId) {
//             return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
//         }

//         // Find the user based on the provided ID
//         const user = await Users.findById(userId);
//         if (!user) {
//             return NextResponse.json({ error: 'User not found' }, { status: 404 });
//         }

//         // Fetch expenses for the user
//         const expenses = await ExpenseModel.find({ createdBy: userId });
//         const totalAdvanced = expenses.reduce((sum, expense) => sum + (expense.advancedReceived || 0), 0);
//         const totalExpense = expenses.reduce((sum, expense) => {
//             const conveyance = expense.conveyance?.amount || 0;
//             const conveyance2 = expense.conveyance2?.amount || 0;
//             const foodExpense = expense.foodExpense?.amount || 0;
//             const hotel = expense.hotel?.amount || 0;
//             const labour = expense.labour?.amount || 0;
//             const otherExpense = expense.otherExpense?.amount || 0;
//             const purchase = expense.purchase?.amount || 0;
//             const purchase2 = expense.purchase2?.amount || 0;
//             const teaFood = expense.teaFood?.amount || 0;
//             const fuel= expense.fuel?.total || 0;
//             return sum + conveyance +conveyance2 + foodExpense + hotel + labour + otherExpense + purchase + purchase2 + teaFood +fuel;
//         }, 0);

//         // Calculate balance and opening balance
//         let balance = 0;
//         let openingBalance = balance + totalAdvanced - totalExpense;
//         balance = balance + openingBalance;

//         const result = {
//             ...user.toObject(),
//             totalAdvanced,
//             totalExpense,
//             balance,
//             openingBalance,
//         };

//         return NextResponse.json(result);
//     } catch (error) {
//         // console.error(error);
//         return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
//     }
// }
// Initialize ImageKit
