// Coarse form-factor check. Decides the platform a device token registers under
// and the matching "wrong device" hint in Settings - both readers must share
// this one copy so the hint can never disagree with what the worker filters on.
export function isMobileUserAgent(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
