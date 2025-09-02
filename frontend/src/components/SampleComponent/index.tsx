import { type FC, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/utils/cn'

const sampleButtonVariants = cva(
  // Base classes - always applied
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300',
        outline: 'border-2 border-purple-600 bg-transparent text-purple-600 hover:bg-purple-600 hover:text-white',
        ghost: 'text-purple-600 hover:bg-purple-50 hover:text-purple-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-lg',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof sampleButtonVariants> & {
    isLoading?: boolean
    icon?: ReactNode
  }

const SampleButton: FC<Props> = ({
  children,
  variant,
  size,
  isLoading = false,
  disabled,
  icon,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(sampleButtonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className='mr-2 h-4 w-4 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      )}
      {icon && !isLoading && <span className='mr-2'>{icon}</span>}
      {children}
    </button>
  )
}

export default SampleButton
