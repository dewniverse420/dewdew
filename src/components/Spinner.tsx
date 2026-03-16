import { useI18n } from '../lib/i18n'
import './Spinner.css'

interface SpinnerProps {
  /** 尺寸：small | medium | large */
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function Spinner({ size = 'medium', className = '' }: SpinnerProps) {
  const { t } = useI18n()
  return (
    <div className={`spinner-wrap spinner-wrap--${size} ${className}`} role="status" aria-label={t('a11y.loading')}>
      <div className="spinner" />
    </div>
  )
}
