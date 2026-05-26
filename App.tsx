// rsvp/production/src/App.tsx
import { useCallback, useEffect, useState } from 'react';
import { InvitationHero } from './components/InvitationHero';
import { SeatCounter } from './components/SeatCounter';
import { RSVPForm } from './components/RSVPForm';
import { Confirmation } from './components/Confirmation';
import type { RsvpFormData, SeatCount, SubmitResponse } from './lib/schema';
import { fetchSeatCount, submitRsvp } from './lib/api';

export function App() {
  const [count, setCount]       = useState<SeatCount | null>(null);
  const [loading, setLoading]   = useState(true);
  const [payload, setPayload]   = useState<RsvpFormData | null>(null);
  const [result, setResult]     = useState<SubmitResponse | null>(null);

  // Initial seat-count load + periodic refresh every 30s while form is visible
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const c = await fetchSeatCount();
        if (alive) setCount(c);
      } catch (err) {
        console.error('[rsvp] seat count error', err);
      } finally {
        if (alive) setLoading(false);
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const handleSubmit = useCallback(async (form: RsvpFormData) => {
    const res = await submitRsvp(form);
    setPayload(form);
    setResult(res);
    // Refresh counts after submit
    try { setCount(await fetchSeatCount()); } catch { /* noop */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleReset = useCallback(() => {
    setPayload(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const full = count ? count.confirmed >= count.capacity : false;
  const showConfirm = payload && result;

  return (
    <div className="app">
      <header className="topbar">
        <a className="topbar__brand" href="#" onClick={(e) => { e.preventDefault(); handleReset(); }}>
          <img src="/assets/logo-mark-orange.png" alt="" />
          <div className="stack">
            <span className="en">PEOPLE'S CULTURE</span>
            <span className="th">ปีกวัฒนธรรมพรรคประชาชน</span>
          </div>
        </a>
        <div className="topbar__date">04 มิ.ย. 69</div>
      </header>

      {!showConfirm && (
        <>
          <InvitationHero />
          <SeatCounter count={count} loading={loading} />
          <RSVPForm full={full} onSubmit={handleSubmit} />
        </>
      )}

      {showConfirm && (
        <Confirmation payload={payload!} result={result!} onReset={handleReset} />
      )}
    </div>
  );
}
