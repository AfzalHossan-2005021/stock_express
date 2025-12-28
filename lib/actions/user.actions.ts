'use server';

import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');

    const users = await db.collection('user').find(
      { email: { $exists: true, $ne: null } },
      { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
    ).toArray();

    return users.filter((user) => user.email && user.name).map((user) => ({
      id: user.id || user._id?.toString() || '',
      email: user.email,
      name: user.name
    }))
  } catch (e) {
    return []
  }
}

type UpdatePreferencesData = {
  fullName: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

export const getCurrentUserPreferences = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id && !session?.user?.email) {
      return { success: false, user: null, message: 'User not authenticated' };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');

    // Try to find user by id first, then by email
    let user = null;
    
    if (session.user.id) {
      user = await db.collection('user').findOne(
        { id: session.user.id }
      );
    }
    
    // If not found by id, try by email
    if (!user && session.user.email) {
      user = await db.collection('user').findOne(
        { email: session.user.email }
      );
    }

    if (!user) {
      return { success: false, user: null, message: 'User not found' };
    }

    return { 
      success: true, 
      user: {
        id: user.id || user._id?.toString() || '',
        name: user.name || '',
        email: user.email || '',
        country: user.country || 'us',
        investmentGoals: user.investmentGoals || 'Growth',
        riskTolerance: user.riskTolerance || 'Medium',
        preferredIndustry: user.preferredIndustry || 'Technology',
      }
    };
  } catch (error) {
    return { success: false, user: null, message: 'Failed to fetch user data' };
  }
}

export const updateUserPreferences = async (data: UpdatePreferencesData) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id && !session?.user?.email) {
      return { success: false, message: 'User not authenticated' };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');

    // Build query to find user by id or email
    const query: any = {};
    if (session.user.id) {
      query.id = session.user.id;
    }
    if (session.user.email) {
      query.email = session.user.email;
    }

    // Try to find user first to see what's in the database
    const existingUser = await db.collection('user').findOne(query);

    if (!existingUser) {
      // If not found with current query, try to find any user with this email
      const userByEmail = await db.collection('user').findOne({ email: session.user.email });
      
      if (userByEmail) {
        // Update using the found user
        const result = await db.collection('user').updateOne(
          { _id: userByEmail._id },
          {
            $set: {
              name: data.fullName,
              country: data.country,
              investmentGoals: data.investmentGoals,
              riskTolerance: data.riskTolerance,
              preferredIndustry: data.preferredIndustry,
            }
          }
        );
        return { success: true, message: 'Preferences updated successfully' };
      }

      return { success: false, message: 'User not found in database' };
    }

    // Update user preferences in the database
    const result = await db.collection('user').updateOne(
      query,
      {
        $set: {
          name: data.fullName,
          country: data.country,
          investmentGoals: data.investmentGoals,
          riskTolerance: data.riskTolerance,
          preferredIndustry: data.preferredIndustry,
        }
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'User not found' };
    }

    if (result.modifiedCount === 0) {
      return { success: true, message: 'No changes were made' };
    }

    // Revalidate the root path to refresh the layout with updated user data
    revalidatePath('/', 'layout');

    return { success: true, message: 'Preferences updated successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to update preferences. Please try again.' };
  }
}

export const deleteUserAccount = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id && !session?.user?.email) {
      return { success: false, message: 'User not authenticated' };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');

    // Build query to find user by id or email
    const query: any = {};
    if (session.user.id) {
      query.id = session.user.id;
    }
    if (session.user.email) {
      query.email = session.user.email;
    }

    // Delete the user from the database
    const result = await db.collection('user').deleteOne(query);

    if (result.deletedCount === 0) {
      // Try by email if id didn't work
      const emailResult = await db.collection('user').deleteOne({ email: session.user.email });
      if (emailResult.deletedCount === 0) {
        return { success: false, message: 'User not found' };
      }
    }

    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, message: 'Failed to delete account. Please try again.' };
  }
}
