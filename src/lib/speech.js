let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}

if (typeof window !== "undefined") {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ar-SA";
  utter.rate = 0.95;
  utter.pitch = 1.05;
  const arVoice = voices.find((v) => v.lang?.startsWith("ar"));
  if (arVoice) utter.voice = arVoice;
  window.speechSynthesis.speak(utter);
}
