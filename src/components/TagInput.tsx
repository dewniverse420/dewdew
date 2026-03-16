import { useState, KeyboardEvent } from 'react'
import './TagInput.css'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  removeAriaLabel?: string
}

export default function TagInput({ value, onChange, placeholder = '输入后按回车添加', removeAriaLabel = 'Remove' }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (t: string) => {
    const tag = t.trim()
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((x) => x !== tag))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
  }

  return (
    <div className="tag-input-wrap">
      <div className="tag-input-tags">
        {value.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button type="button" className="tag-chip-remove" onClick={() => removeTag(tag)} aria-label={removeAriaLabel}>
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input-field"
          placeholder={value.length === 0 ? placeholder : ''}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input.trim() && addTag(input)}
        />
      </div>
    </div>
  )
}
