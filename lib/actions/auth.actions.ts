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

