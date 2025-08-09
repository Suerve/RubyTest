
'use client';

import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/password';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(strength.score)}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>

      {/* Strength Text */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Password Strength: <span className={strength.score >= 5 ? 'text-green-600' : 'text-orange-600'}>
            {getPasswordStrengthText(strength.score)}
          </span>
        </span>
        <span className="text-xs text-gray-500">
          {strength.score}/5 criteria met
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 gap-1 text-xs">
        <RequirementItem
          met={strength.hasMinLength}
          text="At least 8 characters"
        />
        <RequirementItem
          met={strength.hasUppercase}
          text="Uppercase letter"
        />
        <RequirementItem
          met={strength.hasLowercase}
          text="Lowercase letter"
        />
        <RequirementItem
          met={strength.hasNumber}
          text="Number"
        />
        <RequirementItem
          met={strength.hasSpecialChar}
          text="Special character"
        />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? (
        <Check className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      <span>{text}</span>
    </div>
  );
}
