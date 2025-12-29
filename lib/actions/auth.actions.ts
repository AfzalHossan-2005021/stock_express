'use server'

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: {email, password, name: fullName}
    })

    if (response) {
      // Update user with extra fields
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      
      if (db) {
        await db.collection('user').updateOne(
          { email },
          { 
            $set: { 
              country, 
              investmentGoals, 
              riskTolerance, 
              preferredIndustry 
            } 
          }
        );
      }

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
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not found');
    }

    // Find user by email
    const user = await db.collection('user').findOne({ email: email });
    
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    // Find the account document linked to this user
    let account = await db.collection('account').findOne({ userId: user._id.toString() });
    
    // Try ObjectId format if string didn't work
    if (!account) {
      account = await db.collection('account').findOne({ userId: user._id });
    }

    if (!account) {
      return { success: false, message: 'Account not found.' };
    }

    // Hash password using scrypt (better-auth's algorithm)
    // Format: salt:hash where both are hex strings
    // Use @noble/hashes/scrypt exactly like better-auth does
    const { scryptAsync } = await import('@noble/hashes/scrypt.js');
    const { bytesToHex } = await import('@noble/hashes/utils.js');
    const crypto = await import('crypto');
    
    // Generate random salt (16 bytes) and convert to hex string
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = bytesToHex(saltBytes);
    
    // Use scryptAsync to hash the password with better-auth's parameters
    // NOTE: Pass the hex string salt directly, just like better-auth does!
    const key = await scryptAsync(newPassword.normalize('NFKC'), saltHex, {
      N: 16384,
      r: 16,
      p: 1,
      dkLen: 64,
      maxmem: 128 * 16384 * 16 * 2,
    });
    
    const keyHex = bytesToHex(key);
    const hashedPassword = `${saltHex}:${keyHex}`;

    // Update the account password with proper scrypt hash
    const updateResult = await db.collection('account').updateOne(
      { _id: account._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
      return { success: false, message: 'Failed to update password.' };
    }

    // Delete the used reset token
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

