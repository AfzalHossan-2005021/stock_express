'use server'

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: {email, password, name: fullName}
    })

    if (response) {
      // Fire and forget - don't wait for Inngest response
      inngest.send({
        name: 'app/user.created',
        data: {
          email,
          name: fullName,
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
        },
      }).catch(err => {
        console.error('Failed to send Inngest event:', err);
      });
    }

    return { success: true, message: 'Sign up successful' };
  } catch (err: any) {
    console.error('Error during sign up:', err);
    
    // Check if user already exists
    if (err?.statusCode === 422 && err?.body?.message?.includes('already exists')) {
      return { success: false, message: 'User already exists', shouldRedirect: true };
    }
    
    return { success: false, message: err?.body?.message || 'Sign up failed. Please try again.' };
  }
}

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (err) {
    console.error('Error during sign out:', err);
    return { success: false, message: 'Sign out failed. Please try again.'};
  }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    await auth.api.signInEmail({
      body: {email, password}
    })

    return { success: true, message: 'Sign in successful' };
  } catch (err: any) {
    console.error('Error during sign in:', err);
    
    // Check for invalid credentials or user not found
    if (err?.statusCode === 401 || err?.body?.message?.includes('invalid') || err?.body?.message?.includes('Invalid')) {
      return { success: false, message: 'Invalid email or password. Please check your credentials.' };
    }
    
    if (err?.statusCode === 404 || err?.body?.message?.includes('not found')) {
      return { success: false, message: 'Account not found. Please sign up first.' };
    }
    
    return { success: false, message: err?.body?.message || 'Sign in failed. Please try again.' };
  }
}

export const updatePassword = async ({ newPassword, confirmPassword }: { newPassword: string; confirmPassword: string }) => {
  try {
    // Validate password match
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }

    // Validate password length
    if (newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    if (newPassword.length > 128) {
      return { success: false, message: 'Password must be no more than 128 characters long.' };
    }

    const response = await auth.api.changePassword({
      body: {
        newPassword,
        currentPassword: '', // better-auth requires this field
      },
      headers: await headers(),
    });

    return { success: true, message: 'Password updated successfully.' };
  } catch (err: any) {
    console.error('Error updating password:', err);
    return { success: false, message: err?.body?.message || 'Failed to update password. Please try again.' };
  }
}

export const requestPasswordReset = async ({ email }: { email: string }) => {
  try {
    const crypto = await import('crypto');
    const { connectToDatabase } = await import('@/database/mongoose');
    const { PasswordResetToken } = await import('@/database/models/password_reset_token.model');
    
    // Connect to database
    await connectToDatabase();

    // Generate reset token using crypto
    const resetToken = crypto.randomUUID?.() || Math.random().toString(36).substr(2) + Date.now().toString(36);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store the reset token in database with email
    await PasswordResetToken.create({
      token: resetToken,
      email: email,
      expiresAt: expiresAt,
    });

    // Send email with reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`;
    
    // Try to send via Inngest first
    try {
      await inngest.send({
        name: 'app/password.reset.requested',
        data: {
          email,
          resetLink,
          expiresAt: expiresAt.toISOString(),
        },
      });
      console.log('Password reset event sent to Inngest successfully');
    } catch (inngestErr: any) {
      console.warn('Inngest send failed, attempting direct email send:', inngestErr?.message);
      
      // Fallback: Send email directly using nodemailer
      try {
        const { sendPasswordResetEmail } = await import('@/lib/nodemailer');
        await sendPasswordResetEmail({ email, resetLink });
        console.log('Password reset email sent directly via nodemailer');
      } catch (emailErr: any) {
        console.error('Direct email send also failed:', emailErr);
        throw emailErr;
      }
    }

    return { success: true, message: 'If an account exists with this email, a password reset link will be sent shortly.' };
  } catch (err: any) {
    console.error('Error requesting password reset:', err);
    return { success: false, message: 'Failed to send password reset email. Please try again.' };
  }
}

export const resetPassword = async ({ token, newPassword, confirmPassword }: { token: string; newPassword: string; confirmPassword: string }) => {
  try {
    // Validate password match
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }

    // Validate password length
    if (newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    if (newPassword.length > 128) {
      return { success: false, message: 'Password must be no more than 128 characters long.' };
    }

    const { connectToDatabase } = await import('@/database/mongoose');
    const { PasswordResetToken } = await import('@/database/models/password_reset_token.model');
    
    // Connect to database
    await connectToDatabase();

    // Find and validate reset token
    const resetTokenDoc = await PasswordResetToken.findOne({ token });
    
    if (!resetTokenDoc) {
      return { success: false, message: 'Invalid or expired password reset link.' };
    }

    if (resetTokenDoc.expiresAt < new Date()) {
      // Delete expired token
      await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });
      return { success: false, message: 'Password reset link has expired. Please request a new one.' };
    }

    const email = resetTokenDoc.email;

    // Update user password in better-auth's database
    // better-auth stores users in MongoDB, so we can access the connection
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not found');
    }

    // Hash the new password using bcrypt
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('🔍 Searching for user with email:', email);

    // better-auth stores users in 'user' collection and passwords in 'account' collection
    // First, try to find in account collection (might have email field)
    let account = await db.collection('account').findOne({ email: email });

    console.log('🔎 Account search by email:', account ? 'FOUND' : 'NOT FOUND');

    if (!account) {
      // If not found, try to find user and then get their account
      const user = await db.collection('user').findOne({ email: email });
      
      console.log('👤 User found:', user ? 'yes' : 'no');

      if (!user) {
        // Log all collections to debug
        const collections = await db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name));
        console.log('⚠️  User not found with email:', email);
        
        return { success: false, message: 'No account found with this email address. Please sign up first.' };
      }

      console.log('🔑 User ID:', user._id);
      console.log('🔐 User document keys:', Object.keys(user));

      // Better-auth stores password in account collection
      // Let's log the actual account structure
      const allAccounts = await db.collection('account').find({}).limit(3).toArray();
      console.log('🔍 Sample accounts:', JSON.stringify(allAccounts, null, 2));

      // Find account by userId
      let userAccount = await db.collection('account').findOne({ userId: user._id.toString() });
      
      if (!userAccount) {
        // Try with ObjectId format
        userAccount = await db.collection('account').findOne({ userId: user._id });
      }

      if (!userAccount) {
        console.log('❌ No account found for userId, searching all accounts with this user...');
        const allAccounts2 = await db.collection('account').find({}).toArray();
        console.log('🔍 All accounts in DB:', JSON.stringify(allAccounts2, null, 2));
        return { success: false, message: 'User account not found.' };
      }

      console.log('✅ Found account, updating password...');
      console.log('📝 Account ID:', userAccount._id);
      console.log('📝 Account keys:', Object.keys(userAccount));

      // Update the password in the account collection
      const updateResult = await db.collection('account').updateOne(
        { _id: userAccount._id },
        { $set: { password: hashedPassword } }
      );

      console.log('📝 Password update result:', { matchedCount: updateResult.matchedCount, modifiedCount: updateResult.modifiedCount });

      // Delete the used token
      const deletedToken = await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });
      console.log('🗑️  Token deleted:', deletedToken.deletedCount);

      return { 
        success: true, 
        message: 'Password reset successful. Signing you in...',
        email: email,
      };
    }

    // If account was found with email field, update it too (just in case)
    console.log('🔑 Account found with email, updating password...');
    const result = await db.collection('account').updateOne(
      { _id: account._id },
      { $set: { password: hashedPassword } }
    );

    console.log('📝 Account update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

    // Delete the used token
    await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });

    // Return success with email for client-side signin
    return { 
      success: true, 
      message: 'Password reset successful. Signing you in...',
      email: email,
    };
  } catch (err: any) {
    console.error('Error resetting password:', err);
    return { success: false, message: 'Failed to reset password. Please try again.' };
  }
}

