import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const LoadingButton = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button
      disabled={disabled || isLoading}
      className={cn('flex items-center justify-center gap-2', className)}
      {...props}
    >
      {isLoading && <Spinner className='h-4 w-4' />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </Button>
  )
}

export default LoadingButton
