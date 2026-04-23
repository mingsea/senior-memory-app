let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === "undefined") return;
  voices = window.speechSynthesis.getVoices();
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function bestVoice(): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang === "zh-CN") ??
    voices.find((v) => v.lang === "zh_CN") ??
    voices.find((v) => v.lang.startsWith("zh")) ??
    null
  );
}

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Warms up the synthesis engine. Returns true if TTS is available. */
export async function unlockTTS(): Promise<boolean> {
  if (!isTTSSupported()) return false;
  loadVoices();
  return true;
}

export function speak(text: string) {
  if (!isTTSSupported() || !text) return;
  console.log("[TTS] speak:", text.slice(0, 30));
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const v = bestVoice();
  if (v) {
    utt.voice = v;
    utt.lang = v.lang;
  } else {
    utt.lang = "zh-CN";
    console.warn("[TTS] no zh voice found — available:", voices.map((v) => v.lang).join(", ") || "none yet");
  }
  utt.rate = 0.85;
  utt.pitch = 1;
  utt.onerror = (e) => { if (e.error !== "canceled") console.error("[TTS] error:", e.error); };
  utt.onstart = () => console.log("[TTS] started");
  window.speechSynthesis.speak(utt);
}
