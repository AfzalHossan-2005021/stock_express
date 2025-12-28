'use client'

import { useState, useEffect } from 'react'
import { calculatePasswordStrength } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { PASSWORD_STRENGTH_BG_COLORS, PASSWORD_STRENGTH_COLORS, PASSWORD_STRENGTH_TEXT_COLORS } from '@/lib/constants'

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null)

  useEffect(() => {
    if (password) {
      setStrength(calculatePasswordStrength(password))
    } else {
      setStrength(null)
    }
  }, [password])

  if (!strength) return null

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-600">Password Strength</span>
          <span className={`text-xs font-semibold ${PASSWORD_STRENGTH_TEXT_COLORS[strength.strength]}`}>
            {strength.feedback}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${PASSWORD_STRENGTH_COLORS[strength.strength]} transition-all duration-300`}
            style={{ width: `${(strength.score / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className={`p-3 rounded-lg ${PASSWORD_STRENGTH_BG_COLORS[strength.strength]} space-y-2`}>
        <div className="text-xs font-semibold text-gray-700">Password Requirements:</div>
        
        <RequirementItem
          met={strength.requirements.minLength}
          text="At least 8 characters"
        />
        <RequirementItem
          met={strength.requirements.hasUppercase}
          text="One uppercase letter (A-Z)"
        />
        <RequirementItem
          met={strength.requirements.hasLowercase}
          text="One lowercase letter (a-z)"
        />
        <RequirementItem
          met={strength.requirements.hasNumber}
          text="One number (0-9)"
        />
        <RequirementItem
          met={strength.requirements.hasSpecialChar}
          text="One special character (!@#$%^&*)"
        />
      </div>
    </div>
  )
}

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  )
}

export default PasswordStrengthIndicator
