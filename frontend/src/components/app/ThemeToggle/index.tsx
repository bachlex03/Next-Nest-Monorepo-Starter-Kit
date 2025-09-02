'use client'

import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className='bg-primary text-primary-foreground rounded px-4 py-2'
    >
      Toggle Theme
    </button>
  )
}
