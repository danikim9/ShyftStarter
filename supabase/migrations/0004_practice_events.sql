-- 0004 — Shift Prep quiz answers and role-play practice as ActionEvents.
alter type action_event_type add value if not exists 'quiz_answered';
alter type action_event_type add value if not exists 'practiced';
