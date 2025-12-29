'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import InputField from "@/components/forms/InputField"
import { requestPasswordReset } from "@/lib/actions/auth.actions"
import { toast } from "sonner"

const ForgotPasswordDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<{ email: string }>({
    mode: 'onBlur',
  })

  const onSubmit = async (data: { email: string }) => {
    try {
      const result = await requestPasswordReset({ email: data.email })
      
      if (result.success) {
        toast.success('Email sent', { description: 'Check your email for password reset instructions.' })
        reset()
        onOpenChange(false)
      } else {
        toast.error('Request failed', { description: result.message || 'Failed to send reset email.' })
      }
    } catch (error) {
      console.error('Error requesting password reset:', error)
      toast.error('Request failed', { description: error instanceof Error ? error.message : 'Please try again.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-purple-500/50 bg-gray-900 sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Forgot Password?</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            name="email"
            label="Email"
            placeholder="your@email.com"
            register={register}
            error={errors.email}
            inputClassName="bg-transparent rounded-none border-x-0 border-t-0 border-b border-gray-600 focus:!border-purple-500 text-white placeholder:text-gray-500"
            validation={{ 
              required: 'Email is required', 
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } 
            }}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordDialog
