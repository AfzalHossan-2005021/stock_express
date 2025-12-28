'use client'

import { useState } from 'react'
import CountrySelectField from "@/components/forms/CountrySelectField"
import InputField from "@/components/forms/InputField"
import LoadingButton from "@/components/forms/LoadingButton"
import PasswordInputField from "@/components/forms/PasswordInputField"
import PasswordStrengthIndicator from "@/components/forms/PasswordStrengthIndicator"
import SelectField from "@/components/forms/SelectField"
import { signUpWithEmail } from "@/lib/actions/auth.actions"
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const SignUp = () => {
  const router = useRouter()
  const [stage, setStage] = useState(1)
  const [password, setPassword] = useState('')
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, touchedFields, dirtyFields },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      country: 'us',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology',
    },
    mode: 'onBlur',
  })

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data)
      if (result.success) {
        router.push('/')
      } else if (result.shouldRedirect) {
        // Redirect to sign-in if user already exists
        toast.info('Account already exists', { description: 'Please sign in with your email.' })
        router.push('/sign-in')
      } else {
        toast.error('Sign up failed', { description: result.message || 'Please try again.' })
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Sign up failed.', { description: error instanceof Error ? error.message : 'Please try again.' })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gray-800/30 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/10" />

      <div className="relative grid md:grid-cols-2">
        <section className="relative overflow-hidden p-10 md:p-12 flex items-center justify-center bg-gradient-to-br from-purple-500/50 to-purple-500/20 md:order-1 order-1">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gray-900/90 skew-x-12 origin-top" />
          <div className="relative text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">WELCOME BACK!</h2>
            <p className="mt-3 text-sm text-gray-200/90 max-w-xs mx-auto">
              Create your account to personalize your investing experience.
            </p>
          </div>
        </section>

        <section className="p-8 md:p-12 md:order-2 order-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Sign Up</h1>
          <p className="mt-2 text-sm text-gray-400">Get started in a minute.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {stage === 1 && (
              <>
                <InputField
                  name="fullName"
                  label="Full Name"
                  placeholder="Username"
                  register={register}
                  error={errors.fullName}
                  inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
                  validation={{ required: 'Full Name is required', minLength: { value: 2, message: 'Full Name must be at least 2 characters' } }}
                />

                <InputField
                  name="email"
                  label="Email"
                  placeholder="Email"
                  register={register}
                  error={errors.email}
                  inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
                  validation={{ required: 'Email is required', minLength: { value: 2, message: 'Email must be at least 2 characters' }, pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
                />

                <PasswordInputField
                  name="password"
                  label="Password"
                  placeholder="Password"
                  register={register}
                  error={errors.password}
                  inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
                  onChange={(e) => setPassword(e.target.value)}
                  validation={{ required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } }}
                />

                <PasswordStrengthIndicator password={password} />

                <Button 
                  onClick={() => {
                    if (!dirtyFields.fullName || !dirtyFields.email || !dirtyFields.password) {
                      toast.error('Please fill out all required fields before proceeding.')
                      return
                    }
                    if (errors.fullName || errors.email || errors.password) {
                      toast.error('Please fix the errors in the form before proceeding.')
                      return
                    }
                    setStage(2)
                  }}
                  className="h-12 w-full rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg">
                  Next
                </Button>
              </>

            )}
            {stage === 2 && (
              <>
                <CountrySelectField
                  name="country"
                  label="Country"
                  control={control}
                  error={errors.country}
                  required
                />

                <SelectField
                  name="investmentGoals"
                  label="Investment Goals"
                  placeholder="Select your investment goals"
                  options={INVESTMENT_GOALS}
                  control={control}
                  error={errors.investmentGoals}
                  required
                />
                <SelectField
                  name="riskTolerance"
                  label="Risk Tolerance"
                  placeholder="Select your risk tolerance"
                  options={RISK_TOLERANCE_OPTIONS}
                  control={control}
                  error={errors.riskTolerance}
                  required
                />
                <SelectField
                  name="preferredIndustry"
                  label="Preferred Industry"
                  placeholder="Select your preferred industry"
                  options={PREFERRED_INDUSTRIES}
                  control={control}
                  error={errors.preferredIndustry}
                  required
                />

                <Button onClick={() => setStage(1)} className="h-12 w-full rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg">
                  Previous
                </Button>

                <LoadingButton
                  isLoading={isSubmitting}
                  loadingText="Signing up..."
                  className="h-12 w-full rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg"
                >
                  Sign Up
                </LoadingButton>
              </>
            )}

            <div className="text-center pt-4">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-purple-500 hover:text-purple-500/80 font-medium transition-colors">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default SignUp