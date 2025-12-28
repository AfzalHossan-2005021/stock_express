'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const PasswordInputField = ({
  name,
  label,
  placeholder,
  register,
  error,
  validation,
  disabled = false,
  onChange,
}: PasswordInputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='form-label'>{label}</Label>
      <div className='relative'>
        <Input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          {...register(name, validation)}
          onChange={(e) => {
            if (onChange) onChange(e)
          }}
          className={cn('form-input pr-10', { 'opacity-50 cursor-not-allowed': disabled })}
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors',
            { 'opacity-50 cursor-not-allowed': disabled }
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className='w-4 h-4' />
          ) : (
            <Eye className='w-4 h-4' />
          )}
        </button>
      </div>
      {error && <p className="error-message text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

export default PasswordInputField
