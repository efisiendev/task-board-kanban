import { COLOR_PALETTE } from '../../constants/theme'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export function ColorPicker({ value, onChange, size = 'md' }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color.hex}
          type="button"
          onClick={() => onChange(color.hex)}
          className={`${sizeClasses[size]} rounded-lg transition ${
            value === color.hex
              ? 'ring-2 ring-offset-2 ring-gray-900'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color.hex }}
          title={color.name}
        />
      ))}
    </div>
  )
}
