import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Controller } from "react-hook-form"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import countryList from 'react-select-country-list'
import { useMemo, useRef, useState, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"

const CountrySelectField = ({ name, label, control, error, required = false }: CountrySelectProps) => {
  const options = useMemo(() => countryList().getData(), [])
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setTriggerWidth(triggerRef.current?.offsetWidth)
  }, [open])

  const getFlagEmoji = (code: string): string => {
    if (!code) return ''
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map(char => 127397 + char.charCodeAt(0))
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
        {required && ' *'}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field }) => {
          const selected = options.find(
            (o: Option) =>
              (o.value || '').toLowerCase() === (field.value || '').toLowerCase()
          )

          return (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={triggerRef}
                  type="button"
                  variant="outline"
                  className="country-select-trigger"
                >
                  <span className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                      {selected ? getFlagEmoji(selected.value) : ''}
                    </span>
                    <span className="truncate">
                      {selected ? selected.label : 'Select your country'}
                    </span>
                  </span>
                  <ChevronDownIcon className="size-4 opacity-50 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="bg-gray-800 border-gray-600 p-0" style={{ width: triggerWidth }}>
                <Command>
                  <CommandInput placeholder="Search countries..." className="country-select-input" />
                  <CommandList>
                    <CommandEmpty className="country-select-empty">No results found.</CommandEmpty>
                    {options.map((option: Option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        className="country-select-item"
                        onSelect={() => {
                          field.onChange((option.value || '').toLowerCase())
                          setOpen(false)
                        }}
                      >
                        <span className="flex items-center gap-3 w-full">
                          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                            {getFlagEmoji(option.value)}
                          </span>
                          <span className="flex-1 truncate">{option.label}</span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )
        }}
      />
      {error && <p className="error-message text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

export default CountrySelectField