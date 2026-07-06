// Emergency keyword detection — ported from Python original
const EMERGENCY_PATTERNS = [
  /\bheart attack\b/i,
  /\bstroke\b/i,
  /\bcan'?t breathe\b/i,
  /\bcannot breathe\b/i,
  /\bdifficulty breathing\b/i,
  /\bshortness of breath\b/i,
  /\boverdose\b/i,
  /\bsuicid/i,
  /\bself.harm\b/i,
  /\bkilling myself\b/i,
  /\bchest pain\b/i,
  /\bcollapsed\b/i,
  /\bunconscious\b/i,
  /\bseizure\b/i,
  /\banaphylaxis\b/i,
  /\bsevere bleeding\b/i,
  /\bemergency\b/i,
  /\b911\b/i,
  /\bhelp me\b/i,
];

const EMERGENCY_MESSAGE =
  '🚨 **EMERGENCY ALERT**: Your query suggests a potentially life-threatening situation. ' +
  '**Please call your local emergency number (e.g., 112 in India / 911 in the US) immediately ' +
  'or go to the nearest emergency room.** Do not rely on this chatbot in an emergency.';

const DISCLAIMER =
  '⚠️ **Medical Disclaimer:** This information is for educational purposes only and is ' +
  'NOT a substitute for professional medical advice, diagnosis, or treatment. ' +
  'Always consult a qualified healthcare professional for medical concerns.';

export function isEmergency(query) {
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(query));
}

export { EMERGENCY_MESSAGE, DISCLAIMER };
