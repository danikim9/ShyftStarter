import { useRef, useState } from 'react'
import { Camera, X, ImagePlus } from 'lucide-react'
import { useAppState } from '../../lib/store'
import { PrimaryButton } from '../ui'
import { compressImageFile } from '../../lib/imageUtil'

const MAX_PHOTOS = 3

/** Handover note with optional photos. `accept="image/*"` lets iOS offer
 * "사진 찍기 / 사진 보관함 / 파일" in one picker — no plugin needed. Camera use
 * on iOS requires NSCameraUsageDescription in Info.plist (see README). */
export function HandoverComposer() {
  const { addHandover, closeSheet, showToast } = useAppState()
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    try {
      const room = MAX_PHOTOS - photos.length
      const picked = Array.from(files).slice(0, room)
      const out: string[] = []
      for (const f of picked) out.push(await compressImageFile(f))
      setPhotos((p) => [...p, ...out])
      if (files.length > room) showToast(`사진은 최대 ${MAX_PHOTOS}장까지 붙일 수 있어요`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '사진을 불러오지 못했어요')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-950/50 leading-relaxed">
        다음 근무자에게 남길 메모예요. 재고 이슈, 특이 고객, 아직 못 끝낸 일처럼 짧고 구체적인 내용이 좋아요. 진열대·재고 사진을 함께 붙이면 더 빨리 전달돼요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예: POS 2번기 영수증 용지 부족해요. 여분은 창고 하단 서랍에 있습니다."
        rows={4}
        className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50 resize-none"
        autoFocus
      />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
      <div className="flex items-center gap-2 flex-wrap">
        {photos.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-ink-950/10 bg-ink-950/4">
            <img src={src} alt={`첨부 사진 ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-950/70 text-white flex items-center justify-center"
              aria-label="사진 제거"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-xl border border-dashed border-ink-950/20 flex flex-col items-center justify-center gap-1 text-ink-950/50 text-[10px] disabled:opacity-40"
          >
            {photos.length === 0 ? <Camera size={18} /> : <ImagePlus size={18} />}
            {busy ? '처리 중…' : photos.length === 0 ? '사진 찍기 · 선택' : '추가'}
          </button>
        )}
      </div>
      <PrimaryButton
        disabled={busy || (!text.trim() && photos.length === 0)}
        onClick={() => {
          addHandover(text, photos)
          closeSheet()
        }}
      >
        인수인계 남기기{photos.length > 0 ? ` · 사진 ${photos.length}장` : ''}
      </PrimaryButton>
    </div>
  )
}
