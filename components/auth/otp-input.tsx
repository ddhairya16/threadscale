'use client'

import { useRef, useState, type ClipboardEvent, type KeyboardEvent, type ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  length?: number
  onComplete: (value: string) => void
  disabled?: boolean
  className?: string
}

/**
 * 6-digit OTP input with:
 * - Auto-advance on digit entry
 * - Backspace navigates to previous box
 * - Paste fills all boxes
 * - Auto-submits when all digits are filled
 */
export function OtpInput({ length = 6, onComplete, disabled, className }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null))

  function focusAt(index: number) {
    inputRefs.current[index]?.focus()
  }

  function triggerComplete(vals: string[]) {
    if (vals.every((v) => v !== '')) {
      onComplete(vals.join(''))
    }
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    // Only accept digits; take last character (handles rapid typing)
    const digit = e.target.value.replace(/\D/g, '').slice(-1)

    const next = [...values]
    next[index] = digit
    setValues(next)

    if (digit && index < length - 1) {
      focusAt(index + 1)
    }

    triggerComplete(next)
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (values[index]) {
        const next = [...values]
        next[index] = ''
        setValues(next)
      } else if (index > 0) {
        const next = [...values]
        next[index - 1] = ''
        setValues(next)
        focusAt(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusAt(index + 1)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    const next = [...values]
    pasted.split('').forEach((char, i) => {
      if (i < length) next[i] = char
    })
    setValues(next)

    // Focus the next empty box, or the last box if all filled
    const nextEmpty = next.findIndex((v) => !v)
    focusAt(nextEmpty === -1 ? length - 1 : nextEmpty)
    triggerComplete(next)
  }

  return (
    <div className={cn('flex gap-3 justify-center', className)}>
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={2}
          value={value}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            'h-14 w-12 rounded-xl border-2 text-center text-xl font-bold',
            'bg-secondary/40 text-foreground',
            'transition-all duration-150',
            'focus:outline-none focus:ring-0',
            'focus:border-primary focus:bg-primary/10 focus:scale-105 focus:shadow-lg focus:shadow-primary/20',
            value
              ? 'border-primary/50 bg-primary/8 text-foreground shadow-sm shadow-primary/10'
              : 'border-border/60',
            disabled && 'cursor-not-allowed opacity-40'
          )}
        />
      ))}
    </div>
  )
}
