# Gemini chat configuration

The backend uses Gemini's generateContent API and defaults to gemini-3.5-flash-lite.
Set GEMINI_API_KEY in the local backend .env and in Render's environment settings.
GEMINI_MODEL is optional. No Gemini credential belongs in the frontend.
The old OPENAI_API_KEY and OPENAI_MODEL variables are no longer used by chat.

Use a Google AI Studio project explicitly marked Free tier when free-only usage
is required. Free-tier requests are subject to model and project quotas; exceeding
a quota returns a visible retry error. Do not enable billing to resolve that error
unless paid usage is intended. Creating a new key does not create new project quota.

Google's pricing page lists free-tier inputs and outputs as usable to improve its
products. Review these terms before using confidential CRM data. The existing
context builder includes user information, contacts and chat history.

The existing chat/socket contract is unchanged. The backend handles invalid keys,
quota exhaustion, timeouts, blocked outputs, empty responses and truncated replies.
Provider errors are shown to the user instead of saved as fake assistant answers.

References:
- https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite
- https://ai.google.dev/api/generate-content
