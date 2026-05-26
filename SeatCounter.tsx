// rsvp/production/src/components/SeatCounter.tsx
// Public form does not display the live seat count.
// We still receive it (used to gate Confirmed vs Waitlist server-side)
// and surface a polite banner once seats are full.
import type { SeatCount } from '../lib/schema';

export function SeatCounter({ count }: { count: SeatCount | null; loading: boolean }) {
  if (!count) return null;
  const full = count.confirmed >= count.capacity;
  if (!full) return null;
  return (
    <div className="waitlist-banner">
      <i className="material-icons">info</i>
      <div>
        <strong>ขณะนี้ที่นั่งเต็มแล้ว</strong>
        ท่านสามารถลงชื่อในรายการสำรอง (waitlist) ทางทีมงานจะติดต่อกลับหากมีที่นั่งว่าง
      </div>
    </div>
  );
}
