import Spinner from './Spinner'
import './LoadingScreen.css'

interface LoadingScreenProps {
  /** 可选提示文案 */
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <Spinner size="large" />
      {message && <p className="loading-screen-message">{message}</p>}
    </div>
  )
}
