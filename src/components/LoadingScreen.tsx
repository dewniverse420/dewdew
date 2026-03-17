import { useI18n } from '../lib/i18n'
import { APP_VERSION, BUILD_DATE, DEVELOPER_NAME } from '../appMeta'
import Spinner from './Spinner'
import './LoadingScreen.css'

interface LoadingScreenProps {
  /** 可选提示文案，不传则使用 i18n loading.hint */
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useI18n()
  const hint = message != null && message !== '' ? message : t('loading.hint')

  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        <Spinner size="large" />
        <p className="loading-screen-message">{hint}</p>
      </div>
      <footer className="loading-screen-footer">
        <span className="loading-screen-version">{t('loading.version')} v{APP_VERSION}</span>
        {BUILD_DATE && <span className="loading-screen-date">{BUILD_DATE}</span>}
        <span className="loading-screen-developer">{t('loading.developer')}: {DEVELOPER_NAME}</span>
      </footer>
    </div>
  )
}
