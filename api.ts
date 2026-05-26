// rsvp/production/src/lib/api.ts
// Thin client wrapping the Apps Script Web App endpoint.

import {
  type RsvpFormData,
  type SeatCount,
  type SubmitResponse,
  seatCountResponseSchema,
  submitResponseSchema,
  DIET_OPTIONS,
} from './schema';

const API_URL = import.meta.env.VITE_RSVP_API_URL;
const API_TOKEN = import.meta.env.VITE_RSVP_API_TOKEN ?? '';

if (!API_URL) {
  console.warn('[rsvp] VITE_RSVP_API_URL is not set — see .env.example');
}

/** Read current seat counts. Cached for 10s client-side. */
let cache: { at: number; data: SeatCount } | null = null;
const CACHE_MS = 10_000;

export async function fetchSeatCount(): Promise<SeatCount> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const url = new URL(API_URL);
  url.searchParams.set('action', 'count');
  if (API_TOKEN) url.searchParams.set('token', API_TOKEN);

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`Seat count fetch failed: ${res.status}`);
  const raw = await res.json();
  const data = seatCountResponseSchema.parse(raw);
  cache = { at: Date.now(), data };
  return data;
}

/** Invalidate the seat-count cache (call after a successful submit). */
export function invalidateSeatCount() { cache = null; }

/** Submit a new RSVP. Server decides Confirmed vs Waitlist based on capacity. */
export async function submitRsvp(form: RsvpFormData): Promise<SubmitResponse> {
  const dietLabels = form.diet
    .map((id) => DIET_OPTIONS.find((d) => d.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  const body = {
    action: 'submit',
    token:  API_TOKEN || undefined,
    name:   form.name,
    org:    form.org,
    type:   form.type,
    phone:  form.phone,
    diet:   dietLabels,
    dietOther: form.diet.includes('other') ? form.dietOther ?? '' : '',
  };

  // Apps Script Web Apps don't honor preflight; send as text/plain to avoid it.
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RSVP submit failed: ${res.status}`);
  const raw = await res.json();
  const data = submitResponseSchema.parse(raw);
  invalidateSeatCount();
  return data;
}
