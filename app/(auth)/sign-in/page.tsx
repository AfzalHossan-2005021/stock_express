'use client'

import InputField from "@/components/forms/InputField"
import LoadingButton from "@/components/forms/LoadingButton"
import PasswordInputField from "@/components/forms/PasswordInputField"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmail } from "@/lib/actions/auth.actions"
import { toast } from "sonner"
import SocialAuthButtons from "@/components/forms/SocialAuthButtons"

const SignIn = () => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields, dirtyFields },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data)
      if (result.success) {
        router.push('/')
      } else {
        toast.error('Sign in failed', { description: result.message || 'Please try again.' })
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Sign in failed.', { description: error instanceof Error ? error.message : 'Please try again.' })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gray-800/30 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/10" />

      <div className="relative grid md:grid-cols-2">
        <section className="p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Login</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <InputField
              name="email"
              label="Email"
              placeholder="Email"
              register={register}
              error={errors.email}
              inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
              validation={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
            />
            <PasswordInputField
              name="password"
              label="Password"
              placeholder="Password"
              register={register}
              error={errors.password}
              inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
              validation={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
            />

            <LoadingButton
              isLoading={isSubmitting}
              loadingText="Logging in..."
              className="h-12 w-full rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg"
            >
              Login
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="text-purple-500 hover:text-purple-500/80 font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
          <SocialAuthButtons />
        </section>

        <section className="relative overflow-hidden p-10 md:p-12 flex items-center justify-center bg-gradient-to-br from-purple-500/50 to-purple-500/20">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gray-900/90 -skew-x-12 origin-top" />
          <div className="relative text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">WELCOME BACK!</h2>
            <p className="mt-3 text-sm text-gray-200/90 max-w-xs mx-auto">
              Track stocks, manage your watchlist, and stay on top of the market.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SignIn