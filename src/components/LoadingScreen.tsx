import { useI18n } from '../lib/i18n'
import { APP_VERSION, DEVELOPER_NAME } from '../appMeta'
import './LoadingScreen.css'

const LOADING_IMG_SRC = `${import.meta.env.BASE_URL}loading.gif`

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
        <img
          src={LOADING_IMG_SRC}
          alt=""
          className="loading-screen-icon"
          width="120"
          height="256"
          role="presentation"
        />
        <p className="loading-screen-message">{hint}</p>
      </div>
      <footer className="loading-screen-footer">
        <span className="loading-screen-version">{t('loading.version')} v{APP_VERSION}</span>
        <span className="loading-screen-date">{t('loading.buildDate')}</span>
        <span className="loading-screen-developer">{t('loading.developer')}: {DEVELOPER_NAME}</span>
      </footer>
    </div>
  )
}
