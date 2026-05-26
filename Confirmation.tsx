// rsvp/production/src/components/Confirmation.tsx
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

interface Props {
  payload: RsvpFormData;
  result: SubmitResponse;
  onReset: () => void;
}

export function Confirmation({ payload, result, onReset }: Props) {
  const isWaitlist = result.status === 'Waitlist';

  return (
    <section className="confirm">
      <div className={'confirm__crest ' + (isWaitlist ? 'is-waitlist' : '')}>
        <i className="material-icons">{isWaitlist ? 'hourglass_top' : 'check_circle'}</i>
      </div>

      <div className="confirm__head">
        <div className="confirm__eyebrow">
          {isWaitlist ? 'รายการสำรอง · WAITLIST' : 'ยืนยันแล้ว · CONFIRMED'}
        </div>
        <h2 className="confirm__title">
          {isWaitlist ? 'ได้รับชื่อท่านในรายการสำรองแล้ว' : 'ขอบคุณที่เข้าร่วม แล้วเจอกัน'}
        </h2>
      </div>

      <div className="confirm__body">
        {isWaitlist ? (
          <>
            <p>
              ขอบพระคุณท่าน {payload.name} ที่ตอบรับคำเชิญ
              ขณะนี้ที่นั่งครบจำนวนแล้ว ทางเราได้บันทึก
              ชื่อของท่านในรายการสำรองเรียบร้อย
              {result.position && <> (ลำดับที่ {result.position})</>}
            </p>
            <p>
              หากมีที่นั่งว่าง ทีมงานจะรีบติดต่อท่านกลับโดยเร็วที่สุด
            </p>
            <p>
              หากท่านมีคำถามเพิ่มเติม สามารถติดต่อทีมประสานงาน
              ของปีกวัฒนธรรมพรรคประชาชนได้ตลอดเวลา
            </p>
          </>
        ) : (
          <>
            <p>
              ขอบคุณที่เข้าร่วม แล้วเจอกันที่ Cute Corner Cuisine
              พฤหัสบดีที่ 4 มิถุนายน 2569 เวลา 19:00 น.
            </p>
            <p>ร้านตั้งอยู่ปากซอยสุขุมวิท 18</p>
            <p>
              หากท่านนำรถส่วนตัวมา สามารถจอดได้ที่อาคารคอนโด Citismart
              ซึ่งอยู่ใกล้ร้าน
            </p>
            <p>
              หากเดินทางโดยรถไฟฟ้า ลงสถานี MRT สุขุมวิท หรือ BTS อโศก
              เดินออกทางฝั่ง Exchange Tower แล้วเข้าซอยประมาณ 170 เมตร
            </p>
            <p>
              สำหรับเครื่องดื่ม ท่านสามารถนำเครื่องดื่มที่ชื่นชอบ
              มาร่วมโต๊ะได้ตามอัธยาศัย ทางเราได้จัดเตรียมไว้บางส่วนแล้วเช่นกัน
            </p>
          </>
        )}
      </div>

      <div className="confirm__actions">
        <div className="confirm__locate">
          <i className="material-icons">search</i>
          <div>
            <div className="confirm__locate-lbl">การเดินทาง</div>
            <div className="confirm__locate-txt">
              ค้นหาชื่อร้าน <strong>“Cute Corner Cuisine”</strong> ใน Google Maps
            </div>
          </div>
        </div>
        <a className="btn btn-primary" href={CAL_URL} download="peoples-culture-dinner.ics">
          <i className="material-icons">event_available</i>
          เพิ่มลงปฏิทิน
        </a>
        <button className="btn btn-ghost" onClick={onReset}>กลับไปหน้าฟอร์ม</button>
      </div>
    </section>
  );
}
