/**
 * Contact Admin Dialog - Fun Text Variations
 * All the kocak messages for the contact admin dialog
 */

// 20 super kocak main message variations
export const CONTACT_MESSAGES = [
  "Houston, we have a problem. Can you help? 🚀",
  "SOS! Mayday! Need backup ASAP! 🆘",
  "Yo, I'm stuck. Rescue me pls? 🤪",
  "Help! I'm trapped in this page! 😱",
  "Emergency! Send help (and coffee maybe?) ☕",
  "Dude, I need your brain power right now 🧠",
  "Halp! My computer is acting weird again 🤖",
  "Quick! Before I lose my mind! 🤯",
  "Beep boop. Human assistance required 🛸",
  "Warning: Confusion level critical! 💥",
  "Error 404: Solution not found. Help? 🔍",
  "Requesting immediate backup! Over! 📡",
  "Can you be my hero right now? 🦸",
  "I promise I won't bite. Just need help! 🐶",
  "This is fine... NOT! Send help! 🔥",
  "Urgent: Brain.exe has stopped working 💻",
  "Calling tech support... aka you! 📞",
  "I'm lost in the sauce. Guide me! 🗺️",
  "Need wisdom. You got some? 🧙‍♂️",
  "Break glass in case of emergency 🚨"
];

// 20 super kocak footer message variations
export const FOOTER_MESSAGES = [
  "Will reply faster than instant noodles cook ⚡",
  "Response time: Somewhere between now and later 🕐",
  "Usually responds before you finish your coffee ☕",
  "Faster than your internet on a good day 🏃",
  "Reply speed: Sonic the Hedgehog mode 💨",
  "Will ping back ASAP (As Soon As Possible... ish) 📱",
  "Response time: Lightning fast (usually) ⚡",
  "I check messages more than I check Instagram 📬",
  "Replies incoming at warp speed 🚀",
  "Will get back to you before the next meme drops 🎯",
  "Responds faster than you can say 'supercalifragilisticexpialidocious' 🗣️",
  "Usually online during coffee hours (aka always) ☕",
  "Response time: Fast and Furious style 🏎️",
  "Notification mode: Always on, always ready 🔔",
  "Will reply quicker than you can close this dialog 💬",
  "Faster response than microwave popcorn 🍿",
  "Usually available unless sleeping (rarely) 😴",
  "Reply speed: Faster than your WiFi loading bar 📶",
  "Will respond before you refresh this page 🔄",
  "Online more often than your favorite streaming site 📺"
];

/**
 * Get a random message from an array
 * Uses Math.random() for true randomness on each call
 */
export function getRandomMessage(messages: string[]): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Get random contact messages for the dialog
 * Call this every time dialog opens for fresh messages
 */
export function getRandomContactTexts() {
  return {
    contactMessage: getRandomMessage(CONTACT_MESSAGES),
    footerMessage: getRandomMessage(FOOTER_MESSAGES)
  };
}
