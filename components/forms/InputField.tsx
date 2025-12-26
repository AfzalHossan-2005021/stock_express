import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const InputField = ({ name, label, placeholder, type = 'text', register, error, validation, disabled = false, value }:FormInputProps ) => {
  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='form-label'>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, validation)}
        value={value}
        className={cn('form-input', {'opacity-50 cursor-not-allowed': disabled})}
      />
      {error && <p className="error-message text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

export default InputField