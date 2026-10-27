// Chat widget options, shared by index.astro (which renders the interview room's markup only
// while it's enabled) and home.js (which runs it).
export const CHAT_OPTIONS = {
  enabled: false,  // feature flag: the interview room and "Ask about this case" stay out of the page until round 2
  nudge: false     // true: once per visit on desktop, a speech bubble by the chat button invites questions
};
