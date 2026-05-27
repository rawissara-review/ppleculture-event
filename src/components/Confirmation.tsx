// rsvp/production/src/components/Confirmation.tsx
// VERSION: 2026-05-27-confirm-redesign
// Card-based confirmation screen — uses .event-card, .info-grid, .info-tile,
// .byo, .info-card classes from global.css. If layout looks broken,
// verify global.css carries the matching VERSION marker.
import type { RsvpFormData, SubmitResponse } from '../lib/schema';

// ICS calendar invite, generated client-side
const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//PeoplesCulture//EN',
  'BEGIN:VEVENT',
  'UID:pc-dinner-2569@peoplesculture.th',
  'DTSTAMP:20260526T000000Z',
  'DTSTART:20260604T120000Z', // 19:00 ICT = 12:00 UTC
  'DTEND:20260604T170000Z',   // midnight ICT = 17:00 UTC
  'SUMMARY:Sit-down Dinner · ปีกวัฒนธรรมพรรคประชาชน',
  'LOCATION:Cute Corner Cuisine\\, ปากซอยสุขุมวิท 18\\, Bangkok',
  'DESCRIPTION:ร่วมโต๊ะอาหารค่ำ - 19:00 น. ถึงเที่ยงคืน',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');
const CAL_URL = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ICS);

const MAPS_URL = 'https://maps.app.goo.gl/DbpFQfafd7Mt2LPr9';

interface Props {
  payload: RsvpFormData;
  result: SubmitResponse;
  onReset: () => void;
}

export function Confirmation({ payload, result, onReset }: Props) {
  const isWaitlist = result.status === 'Waitlist';
  const firstName = (payload.name || '').trim().split(/\s+/)[0];

  if (isWaitlist) {
    return (
      <section className="confirm">
        <div className="confirm__crest is-waitlist">
          <i className="material-icons">hourglass_top</i>
        </div>

        <div className="confirm__head">
          <div className="confirm__eyebrow is-waitlist">รายการสำรอง · WAITLIST</div>
          <h2 className="confirm__title">ได้รับชื่อท่านในรายการสำรองแล้ว</h2>
          <p className="confirm__lede">
            ขอบพระคุณ{firstName ? `คุณ ${firstName}` : 'ท่าน'}ที่ตอบรับคำเชิญ ขณะนี้ที่นั่งเต็มจำนวนแล้ว
            ทางทีมงานได้บันทึกชื่อของท่านในรายการสำรองเรียบร้อยแล้ว
            {result.position && <> (ลำดับที่ {result.position})</>}
          </p>
        </div>

        <div className="info-card">
          <div className="info-card__row">
            <div className="info-card__icon">
              <i className="material-icons">notifications_active</i>
            </div>
            <div className="info-card__body">
              <div className="info-card__lbl">ขั้นตอนต่อไป</div>
              <div className="info-card__val">
                หากมีที่นั่งว่างเพิ่มเติม ทีมงานจะติดต่อกลับไปแจ้งท่านโดยเร็วที่สุด
              </div>
            </div>
          </div>
          <div className="info-card__row">
            <div className="info-card__icon">
              <i className="material-icons">forum</i>
            </div>
            <div className="info-card__body">
              <div className="info-card__lbl">มีคำถามเพิ่มเติม?</div>
              <div className="info-card__val">
                สามารถติดต่อทีมประสานงานของปีกวัฒนธรรมพรรคประชาชนได้ตลอดเวลา
              </div>
            </div>
          </div>
        </div>

        <div className="confirm__actions">
          <button className="btn btn-ghost" onClick={onReset}>
            <i className="material-icons">arrow_back</i>
            กลับไปหน้าฟอร์ม
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="confirm">
      <div className="confirm__crest">
        <i className="material-icons">check_circle</i>
      </div>

      <div className="confirm__head">
        <div className="confirm__eyebrow">ยืนยันแล้ว · CONFIRMED</div>
        <h2 className="confirm__title">
          {firstName ? `สำรองที่นั่งสำเร็จ ขอขอบคุณ คุณ ${firstName}` : 'สำรองที่นั่งเรียบร้อย'}
          <br />
          แล้วเจอกันค่ะ
        </h2>
      </div>

      {/* Event detail card */}
      <div className="event-card">
        <div className="event-card__venue">
          <div className="event-card__venue-name">Cute Corner Cuisine</div>
          <div className="event-card__venue-sub">
            ปากซอยสุขุมวิท 18 · กรุงเทพมหานคร
          </div>
        </div>
        <div className="event-card__rows">
          <div className="event-card__row">
            <div className="event-card__row-icon">
              <i className="material-icons">event</i>
            </div>
            <div>
              <div className="event-card__row-lbl">วันที่</div>
              <div className="event-card__row-val">พฤหัสบดี 4 มิถุนายน 2569</div>
            </div>
          </div>
          <div className="event-card__row">
            <div className="event-card__row-icon">
              <i className="material-icons">schedule</i>
            </div>
            <div>
              <div className="event-card__row-lbl">เวลา</div>
              <div className="event-card__row-val">19:00 น. – เที่ยงคืน</div>
            </div>
          </div>
        </div>
        <a
          className="btn btn-primary event-card__cta"
          href={CAL_URL}
          download="peoples-culture-dinner.ics"
        >
          <i className="material-icons">event_available</i>
          เพิ่มลงปฏิทิน
        </a>
      </div>

      {/* Getting there */}
      <div className="info-section">
        <div className="info-section__head">การเดินทาง</div>
        <div className="info-grid">
          <div className="info-tile">
            <div className="info-tile__icon">
              <i className="material-icons">directions_subway</i>
            </div>
            <div className="info-tile__lbl">รถไฟฟ้า</div>
            <div className="info-tile__val">MRT สุขุมวิท · BTS อโศก</div>
            <div className="info-tile__hint">
              ออกฝั่ง Exchange Tower · เดินต่อประมาณ 170 เมตร
            </div>
          </div>
          <div className="info-tile">
            <div className="info-tile__icon">
              <i className="material-icons">local_parking</i>
            </div>
            <div className="info-tile__lbl">ที่จอดรถ</div>
            <div className="info-tile__val">Citi Smart Condo</div>
            <div className="info-tile__hint">พื้นที่จอดรถใกล้ร้านจัดงาน</div>
          </div>
        </div>
        <a
          className="btn btn-ghost info-section__cta"
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="material-icons">map</i>
          เปิดใน Google Maps
        </a>
      </div>

      {/* BYO drinks */}
      <div className="byo">
        <div className="byo__icon">
          <i className="material-icons">wine_bar</i>
        </div>
        <div className="byo__text">
          <strong>สามารถนำเครื่องดื่มที่ชอบมาร่วมโต๊ะได้</strong>
          <span>ทางทีมงานจัดเตรียมเครื่องดื่มบางส่วนไว้ต้อนรับแล้วบางส่วน</span>
        </div>
      </div>

      <button className="confirm__back" onClick={onReset}>
        <i className="material-icons">arrow_back</i>
        กลับไปหน้าฟอร์ม
      </button>
    </section>
  );
}
