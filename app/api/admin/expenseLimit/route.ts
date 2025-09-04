'use server';
import DB from "@app/_database/db";
import { NextRequest, NextResponse } from "next/server";
import mongoose from 'mongoose';
import ExpenseLimit from "@app/_model/expenseLimit.modal";
import Users from "@app/_model/user.model";

(async function initializeDB() {
  await DB();
})();

export async function PUT(req: NextRequest) {
  try {
    const receivedFormData = await req.formData();
    const rawData = receivedFormData.get('data') as string;
    const data: any = JSON.parse(rawData || '{}');
    const actionType = receivedFormData.get('actionType');
    const actionSave = receivedFormData.get('actionSave');
    const usersToChange = JSON.parse(receivedFormData.get('usersToChange') as string || '[]');
    const selectAllChecked = receivedFormData.get('selectAllChecked') === 'true';
    const getObjectId = (id: string) => new mongoose.Types.ObjectId(id);
    const createdBy = getObjectId(receivedFormData.get('createdBy') as string || '');

    let result: any;
    let origin: any;

    if (actionType === 'new') {
      const name = receivedFormData.get('name') as string;
      const userId = getObjectId(receivedFormData.get('userId') as string || '');
      result = await ExpenseLimit.create({ name, userId, createdBy });
    } else {
      const updateFields:any = {
        conveyance: data.conveyance,
        purchase: data.purchase,
        food: data.food,
        tea: data.tea,
        hotel: data.hotel,
        labour: data.labour,
        courier: data.courier,
        loading: data.loading,
        porter: data.porter,
        cartage: data.cartage,
        rider: data.rider,
        daily_wages: data.daily_wages,
        transport: data.transport,
        maintenance: data.maintenance,
        contractor: data.contractor,
        other: data.other,
        max_limit: data.max_limit,
        status: data.status,
        createdBy,
      };

      const buildUpdate = async (doc: any) => {
        const updates: Record<string, any> = {};
        for (const key in updateFields) {
          updates[key] = updateFields[key] ? updateFields[key] : doc[key];
        }
        return updates;
      };

      let targets;
      if (selectAllChecked) {
        targets = await ExpenseLimit.find({});
      } else {
        const ids = usersToChange.map(getObjectId);
        targets = await ExpenseLimit.find({ userId: { $in: ids } });
      }

      if (targets.length > 0) {
        const bulkOps = [];

        for (const doc of targets) {
          const updates = await buildUpdate(doc);

          if (actionSave === 'temporary') {
            const originSnapshot = { ...doc.toObject(), expireAt: new Date(Date.now() + 30 * 60000) };
            await mongoose.connection.collection('rollback_expense_limits').insertOne(originSnapshot);
          }

          bulkOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: updates },
            },
          });
        }

        result = await ExpenseLimit.bulkWrite(bulkOps);
      }
    }

    const success = actionType === 'new' ? result : result?.modifiedCount > 0 || result?.nModified > 0;

    return NextResponse.json(
      success
        ? {
            type: 'SUCCESS',
            message:
              'Limit updated successfully!' +
              (actionSave === 'temporary' ? ' Changes will revert in 30 minutes.' : ''),
          }
        : { type: 'ERROR', message: 'Limit update failed!' },
      { status: success ? 201 : 500 }
    );
  } catch (error) {
    console.error('Error creating limit expenses:', error);
    return NextResponse.json(
      { type: 'ERROR', message: 'Something went wrong!' },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {
    const searchUrl = new URL(req.url);
    const name = searchUrl.searchParams.get('name') || '';
    const page = parseInt(searchUrl.searchParams.get("page") || "1");
    const limit = parseInt(searchUrl.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    let filterQuery:any={};
    if(name && name.trim()){
      filterQuery.name = { $regex: name, $options: 'i' };
    }
    const result = await ExpenseLimit.find(filterQuery)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit).populate([
      { path: 'createdBy', model: Users, select: '_id name' }
    ])
  
    if (!result) {
      return NextResponse.json(
        { type: 'ERROR', message: 'User expense limit not found!' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { type: 'SUCCESS', result },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { type: 'ERROR', message: 'Something went wrong!' },
      { status: 500 }
    );
  }
}

