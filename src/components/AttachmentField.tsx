import { useI18n } from '../lib/i18n'
import type { Attachment } from '../types'
import './AttachmentField.css'

interface AttachmentFieldProps {
  attachments: Attachment[]
  onChange: (attachments: Attachment[]) => void
  /** 随记封面：当前选中的封面附件 id */
  coverAttachmentId?: string | null
  /** 随记封面：选择某张图为封面时回调 */
  onCoverChange?: (id: string | null) => void
}

export default function AttachmentField({
  attachments,
  onChange,
  coverAttachmentId = null,
  onCoverChange,
}: AttachmentFieldProps) {
  const { t } = useI18n()
  const addFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const fileList = Array.from(files)
    Promise.all(
      fileList.map(
        (file) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                dataUrl: reader.result as string,
              })
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          })
      )
    ).then((newAttachments) => {
      onChange(attachments.concat(newAttachments))
    })
    e.target.value = ''
  }

  const remove = (id: string) => {
    const next = attachments.filter((a) => a.id !== id)
    onChange(next)
    if (coverAttachmentId === id && onCoverChange) {
      const firstImg = next.find((a) => a.type.startsWith('image/'))
      onCoverChange(firstImg ? firstImg.id : null)
    }
  }

  return (
    <div className="attachment-field">
      <div className="attachment-list">
        {attachments.map((a) => (
          <div key={a.id} className="attachment-item">
            {a.type.startsWith('image/') ? (
              <img src={a.dataUrl} alt={a.name} className="attachment-thumb" />
            ) : (
              <span className="attachment-icon">📎</span>
            )}
            <span className="attachment-name" title={a.name}>
              {a.name}
            </span>
            {a.type.startsWith('image/') && onCoverChange && (
              <button
                type="button"
                className={`attachment-cover-btn ${coverAttachmentId === a.id ? 'is-cover' : ''}`}
                onClick={() => onCoverChange(coverAttachmentId === a.id ? null : a.id)}
                aria-label={coverAttachmentId === a.id ? t('attachment.unsetCover') : t('attachment.setCover')}
              >
                {coverAttachmentId === a.id ? t('attachment.cover') : t('attachment.coverShort')}
              </button>
            )}
            <button type="button" className="btn-icon attachment-remove" onClick={() => remove(a.id)} aria-label={t('common.remove')}>
              ×
            </button>
          </div>
        ))}
      </div>
      <label className="attachment-add">
        <input type="file" accept="image/*,.pdf,.txt" multiple hidden onChange={addFile} />
        + {t('attachment.add')}
      </label>
    </div>
  )
}
