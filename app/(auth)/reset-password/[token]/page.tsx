'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import PasswordInputField from "@/components/forms/PasswordInputField"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { resetPassword, signInWithEmail } from "@/lib/actions/auth.actions"
import { toast } from "sonner"

const ResetPassword = () => {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [isValidating, setIsValidating] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    reset,
  } = useForm<{ newPassword: string; confirmPassword: string }>({
    mode: 'onBlur',
  })

  useEffect(() => {
    // Validate token format (should be UUID-like)
    if (token && typeof token === 'string' && token.length > 0) {
      setIsValidating(false)
    }
  }, [token])

  const onSubmit = async (data: { newPassword: string; confirmPassword: string }) => {
    try {
      const result = await resetPassword({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })

      if (result.success && result.email) {
        toast.success('Password reset successful', { description: 'Signing you in...' })
        reset()
        
        // Attempt to sign in with the new password and email from reset
        setIsSigningIn(true);
        const signInResult = await signInWithEmail({
          email: result.email,
          password: data.newPassword,
        });

        if (signInResult.success) {
          toast.success('Signed in successfully', { description: 'Welcome back!' })
          // Redirect to dashboard
          setTimeout(() => {
            router.push('/')
          }, 500)
        } else {
          toast.info('Password reset complete', { description: 'Please sign in with your new password.' })
          // Redirect to sign-in page
          setTimeout(() => {
            router.push('/sign-in')
          }, 1500)
        }
      } else {
        toast.error('Reset failed', { description: result.message || 'Failed to reset password.' })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Reset failed', { description: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setIsSigningIn(false);
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gray-800/30 shadow-2xl m-4 md:mx-auto md:max-w-md">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/10" />
        <div className="relative p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Invalid Link</h1>
          <p className="mt-3 text-gray-400">The password reset link is invalid or has expired.</p>
          <Link href="/sign-in" className="mt-6 inline-block text-purple-500 hover:text-purple-400 font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gray-800/30 shadow-2xl w-full max-w-md">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/10" />

        <div className="relative p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-400">Enter your new password below.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <PasswordInputField
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              register={register}
              error={errors.newPassword}
              inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
              validation={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                maxLength: { value: 128, message: 'Password must be no more than 128 characters' },
              }}
            />

            <PasswordInputField
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              register={register}
              error={errors.confirmPassword}
              inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
              validation={{
                required: 'Please confirm your password',
                validate: (value: string) =>
                  value === getValues('newPassword') || 'Passwords do not match',
              }}
            />

            <Button
              type="submit"
              disabled={isSubmitting || isSigningIn}
              className="h-12 w-full rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg mt-6"
            >
              {isSubmitting || isSigningIn ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link href="/sign-in" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
