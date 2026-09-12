// Camera / photo access with an explicit permission check.
//
// Native (Capacitor iOS/Android): uses @capacitor/camera so we can read the
// real OS permission state, ask for it, and explain what to do when it was
// denied. Web (browser, artifact preview): the OS permission API is not
// available in WKWebView/Safari, so callers fall back to <input type="file">
// and the browser handles the prompt itself. Microphone is never requested.
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export type CameraAccessState =
  | 'granted' // OS permission granted
  | 'prompt' // not asked yet — requesting will show the OS dialog
  | 'denied' // user refused — only the OS Settings app can change it
  | 'limited' // iOS "selected photos only" (photos permission)
  | 'web' // running in a browser: the browser manages the prompt per site

export interface CameraAccess {
  camera: CameraAccessState
  photos: CameraAccessState
}

export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

function map(state: string): CameraAccessState {
  if (state === 'granted') return 'granted'
  if (state === 'denied') return 'denied'
  if (state === 'limited') return 'limited'
  return 'prompt' // 'prompt' | 'prompt-with-rationale'
}

export async function checkCameraAccess(): Promise<CameraAccess> {
  if (!isNativeApp()) return { camera: 'web', photos: 'web' }
  try {
    const s = await Camera.checkPermissions()
    return { camera: map(s.camera), photos: map(s.photos) }
  } catch {
    return { camera: 'prompt', photos: 'prompt' }
  }
}

export async function requestCameraAccess(kind: 'camera' | 'photos'): Promise<CameraAccessState> {
  if (!isNativeApp()) return 'web'
  try {
    const s = await Camera.requestPermissions({ permissions: [kind] })
    return map(kind === 'camera' ? s.camera : s.photos)
  } catch {
    return 'denied'
  }
}

export const ACCESS_LABEL: Record<CameraAccessState, string> = {
  granted: '허용됨',
  prompt: '아직 묻지 않음',
  denied: '거부됨 — 설정에서 변경',
  limited: '일부 사진만 허용',
  web: '브라우저가 관리',
}

/** Where a denied permission gets fixed. iOS cannot deep-link into our app's
 * Settings page from a web view without an extra plugin, so we spell it out. */
export const SETTINGS_HINT = '설정 → ShyftStarter → 카메라를 켜주세요. 앱 안에서는 다시 물어볼 수 없어요.'

export type CapturedPhoto = { dataUrl: string } | { cancelled: true } | { error: string }

/** Native capture. Checks/requests permission first; never touches the microphone. */
export async function capturePhotoNative(source: 'camera' | 'photos'): Promise<CapturedPhoto> {
  const kind = source
  let state = (await checkCameraAccess())[kind]
  if (state === 'prompt') state = await requestCameraAccess(kind)
  if (state === 'denied') return { error: kind === 'camera' ? `카메라 권한이 꺼져 있어요. ${SETTINGS_HINT}` : '사진 접근 권한이 꺼져 있어요. 설정 → ShyftStarter → 사진에서 허용해주세요.' }
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      quality: 80,
      width: 1280,
      correctOrientation: true,
      saveToGallery: false,
      promptLabelHeader: '인수인계 사진',
    })
    return photo.dataUrl ? { dataUrl: photo.dataUrl } : { error: '사진을 불러오지 못했어요.' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/cancel/i.test(msg)) return { cancelled: true }
    if (/denied|permission/i.test(msg)) return { error: `카메라 권한이 필요해요. ${SETTINGS_HINT}` }
    return { error: '사진을 불러오지 못했어요. 다시 시도해주세요.' }
  }
}
