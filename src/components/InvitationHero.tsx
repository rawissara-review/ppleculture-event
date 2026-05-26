// rsvp/production/src/components/InvitationHero.tsx
export function InvitationHero() {
  return (
    <section className="invite">
      <div className="invite__wm" aria-hidden="true">
        <img src="/assets/logo-mark-orange.png" alt="" />
      </div>
      <div className="invite__line">ปีกวัฒนธรรมพรรคประชาชน ขอเรียนเชิญท่าน</div>
      <h1 className="invite__title">
        ร่วมโต๊ะอาหารค่ำ<br />Sit-down Dinner
      </h1>

      <div className="invite__divider" />

      <div className="invite__details">
        <Row icon="event"    k="วันที่"   v="พฤหัสบดีที่ 4 มิถุนายน 2569" />
        <Row icon="schedule" k="เวลา"     v="19:00 น. – เที่ยงคืน" />
        <Row icon="place"    k="สถานที่"   v="Cute Corner Cuisine" sub="ปากซอยสุขุมวิท 18" />
      </div>
    </section>
  );
}

function Row({ icon, k, v, sub }: { icon: string; k: string; v: string; sub?: string }) {
  return (
    <div className="invite__row">
      <i className="material-icons">{icon}</i>
      <div>
        <div className="k">{k}</div>
        <div className="v">{v}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}
