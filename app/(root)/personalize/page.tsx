'use client'

import { useState, useEffect } from 'react'
import CountrySelectField from "@/components/forms/CountrySelectField"
import LoadingButton from "@/components/forms/LoadingButton"
import SelectField from "@/components/forms/SelectField"
import InputField from "@/components/forms/InputField"
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { updateUserPreferences, getCurrentUserPreferences } from "@/lib/actions/user.actions"
import { Button } from '@/components/ui/button'

type UpdatePreferencesFormData = {
  fullName: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

const PersonalizePage = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<UpdatePreferencesFormData>({
    mode: 'onBlur',
  })

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await getCurrentUserPreferences()
        
        if (result.success && result.user) {
          setUser(result.user)
          // Set form values
          setValue('fullName', result.user.name || '')
          setValue('country', result.user.country || 'us')
          setValue('investmentGoals', result.user.investmentGoals || 'Growth')
          setValue('riskTolerance', result.user.riskTolerance || 'Medium')
          setValue('preferredIndustry', result.user.preferredIndustry || 'Technology')
        } else {
          toast.error('Error', { description: result.message || 'Failed to load user data' })
        }
      } catch (error) {
        toast.error('Error', { description: 'Failed to load user data' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [setValue])

  const onSubmit = async (data: UpdatePreferencesFormData) => {
    try {
      const result = await updateUserPreferences({
        fullName: data.fullName,
        country: data.country,
        investmentGoals: data.investmentGoals,
        riskTolerance: data.riskTolerance,
        preferredIndustry: data.preferredIndustry,
      })

      if (result.success) {
        toast.success('Preferences updated', { description: 'Your preferences have been updated successfully.' })
        // Hard refresh to ensure fresh session data
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        toast.error('Update failed', { description: result.message || 'Please try again.' })
      }
    } catch (error) {
      toast.error('Update failed', { description: 'An unexpected error occurred.' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-400 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Update Preferences</h1>
          <p className="text-gray-500">Manage your personal information and investment preferences.</p>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-800">
            <p className="text-sm text-gray-500 mb-2">Current Information</p>
            <div className="text-sm text-gray-300">
              <p><span className="text-gray-400">Email:</span> {user.email}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <InputField
            name="fullName"
            label="Full Name"
            placeholder="Your full name"
            register={register}
            error={errors.fullName}
            validation={{
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            }}
          />

          {/* Country */}
          <CountrySelectField
            name="country"
            label="Country"
            control={control}
            error={errors.country}
          />

          {/* Investment Goals */}
          <SelectField
            name="investmentGoals"
            label="Investment Goals"
            placeholder="Select your investment goal"
            options={INVESTMENT_GOALS}
            control={control}
            error={errors.investmentGoals}
          />

          {/* Risk Tolerance */}
          <SelectField
            name="riskTolerance"
            label="Risk Tolerance"
            placeholder="Select your risk tolerance"
            options={RISK_TOLERANCE_OPTIONS}
            control={control}
            error={errors.riskTolerance}
          />

          {/* Preferred Industry */}
          <SelectField
            name="preferredIndustry"
            label="Preferred Industry"
            placeholder="Select your preferred industry"
            options={PREFERRED_INDUSTRIES}
            control={control}
            error={errors.preferredIndustry}
          />

          {/* Buttons Side by Side */}
          <div className="flex gap-4 pt-4">
            <LoadingButton
              isLoading={isSubmitting}
              loadingText="Updating..."
              className="flex-1"
            >
              Update Preferences
            </LoadingButton>

            <Button
              type="button"
              onClick={() => router.push('/')}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PersonalizePage
