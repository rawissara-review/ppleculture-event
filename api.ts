// rsvp/production/src/lib/api.ts
// Thin client wrapping the Apps Script Web App endpoint.

import {
  type RsvpFormData,
  type SeatCount,
  type SubmitResponse,
  seatCountResponseSchema,
  submitResponseSchema,
} from './schema';

const API_URL = import.meta.env.VITE_RSVP_API_URL;
const API_TOKEN = import.meta.env.VITE_RSVP_API_TOKEN ?? '';

if (!API_URL) {
  console.warn('[rsvp] VITE_RSVP_API_URL is not set — see .env.example');
}

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

export function invalidateSeatCount() { cache = null; }

export async function submitRsvp(form: RsvpFormData): Promise<SubmitResponse> {
  const body = {
    action: 'submit',
    token:  API_TOKEN || undefined,
    name:   form.name,
    org:    form.org,
    type:   form.type,
    phone:  form.phone,
    diet:   (form.diet ?? '').trim() || 'ไม่ระบุ',
    dietOther: '',
  };

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
