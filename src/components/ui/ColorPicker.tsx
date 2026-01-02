import { COLOR_PALETTE } from '../../constants/theme'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export function ColorPicker({ value, onChange, size = 'md', disabled = false }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color.hex}
          type="button"
          onClick={() => !disabled && onChange(color.hex)}
          disabled={disabled}
          className={`${sizeClasses[size]} rounded-lg transition ${
            value === color.hex
              ? 'ring-2 ring-offset-2 ring-gray-900'
              : disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color.hex }}
          title={color.name}
        />
      ))}
    </div>
  )
}
