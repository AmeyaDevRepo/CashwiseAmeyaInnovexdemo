'use server'
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb'; // or from 'mongoose' if you're using Mongoose
import DB from '@app/_database/db';
import OfficeExpense from '@app/_model/office.modal';
import TravelExpense from '@app/_model/travel.modal';
import Users from '@app/_model/user.model';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

// Initialize database connection
(async function initializeDB() {
    await DB();
  })();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || ''; // User id
        const type = searchParams.get('type') || ''; // User type
        const fromDate = searchParams.get('fromDate') || null; // Expense date range start
        const toDate = searchParams.get('toDate') || null; // Expense date range end

        let expenseFilter: any = {};

        if (fromDate && !toDate) {
            expenseFilter.date = { $gte: DateTime.fromISO(fromDate).setZone('Asia/Kolkata').startOf('day').toISODate() };
        }
        if (!fromDate && toDate) {
            expenseFilter.date = { $lte: DateTime.fromISO(toDate).setZone('Asia/Kolkata').startOf('day').toISODate() };
        }
        if (fromDate && toDate) {
            expenseFilter.date = { $gte: DateTime.fromISO(fromDate).setZone('Asia/Kolkata').startOf('day').toISODate(), $lte: DateTime.fromISO(toDate).setZone('Asia/Kolkata').startOf('day').toISODate() };
        }

        let officeExpenses: any = [];
        let travelExpenses: any = [];

        // Fetch office expenses if type is not 'travel'
        if (type !== 'travel') {
            officeExpenses = await OfficeExpense.find(expenseFilter).lean();
        }

        // Fetch travel expenses if type is not 'office'
        if (type !== 'office') {
            travelExpenses = await TravelExpense.find(expenseFilter).lean();
        }

        let totalOffice = 0;
        let totalTravel = 0;

        // Calculate total office expenses
        if (officeExpenses.length > 0) {
            officeExpenses.forEach((expenseItem: any) => {
                Object.keys(expenseItem).forEach((key) => {
                    if (Array.isArray(expenseItem[key])) { 
                        expenseItem[key].forEach((expense: any) => {
                            totalOffice += (expense.amount || 0);
                        });
                    }
                });
            });
        }

        // Calculate total travel expenses
        if (travelExpenses.length > 0) {
            travelExpenses.forEach((expenseItem: any) => {
                Object.keys(expenseItem).forEach((key) => {
                    if (Array.isArray(expenseItem[key])) { 
                        expenseItem[key].forEach((expense: any) => {
                            totalTravel += (expense.amount || 0);
                        });
                    }
                });
            });
        }

        return NextResponse.json(
            { 
                type: 'SUCCESS', 
                officeExpenses, 
                travelExpenses, 
                totalOfficeExpense: totalOffice, 
                totalTravelExpense: totalTravel 
            }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching user and expense data:', error);
        return NextResponse.json(
            { type: 'ERROR', message: 'Something went wrong!' }, 
            { status: 500 }
        );
    }
}
