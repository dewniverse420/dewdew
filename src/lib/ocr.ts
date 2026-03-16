/**
 * 使用 Tesseract.js 从图片中识别文字
 */

import Tesseract from 'tesseract.js'

export async function recognizeTextFromImage(file: File): Promise<string> {
  const result = await Tesseract.recognize(file, 'chi_sim+eng', {
    logger: () => {},
  })
  return (result.data?.text ?? '').trim()
}

/** 将识别出的整段文字拆成待办标题与描述：首行为标题，其余为描述 */
export function textToTodoPrefill(text: string): { title: string; description: string } {
  const trimmed = text.trim()
  if (!trimmed) return { title: '', description: '' }
  const lines = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const firstLine = lines[0] ?? ''
  const rest = lines.slice(1).join('\n')
  const title = firstLine.slice(0, 200)
  const description = rest || (firstLine.length > 200 ? firstLine.slice(200) : '')
  return { title, description }
}
