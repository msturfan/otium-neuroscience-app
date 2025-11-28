'use client'

import { checkPasswordStrength } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Props = {
  password: string
  className?: string
}

function PasswordStrengthIndicator({ password, className }: Props) {
  if (!password) return null

  const strength = checkPasswordStrength(password)
  const widthPercentage = (strength.score / 4) * 100

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-300', strength.color)}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{strength.label}</span>
      </p>
    </div>
  )
}

export default PasswordStrengthIndicator

