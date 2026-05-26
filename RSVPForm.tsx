// rsvp/production/src/components/RSVPForm.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  rsvpSchema,
  type RsvpFormData,
  ATTENDEE_TYPES,
  DIET_OPTIONS,
  type DietId,
} from '../lib/schema';

interface Props {
  full: boolean;
  onSubmit: (data: RsvpFormData) => Promise<void>;
}

export function RSVPForm({ full, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '', org: '', phone: '',
      type: undefined as unknown as RsvpFormData['type'],
      diet: ['none'], dietOther: '',
    },
  });

  const dietSelected = watch('diet') ?? [];
  const showOther = dietSelected.includes('other');
  const submitLabel = full ? 'ลงชื่อรายการสำรอง' : 'ยืนยันการเข้าร่วม';

  const cls = (field: keyof RsvpFormData) =>
    'input ' + (touchedFields[field] && errors[field] ? 'is-invalid' : '');

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form__head">
        <h2 className="form__title">เรียนเชิญร่วมโต๊ะอาหารค่ำ</h2>
        <p className="form__sub">กรุณากรอกข้อมูลด้านล่างเพื่อยืนยันการเข้าร่วม</p>
      </div>

      {/* name */}
      <div className="field">
        <label className="field__label" htmlFor="name">ชื่อ-นามสกุล <span className="req">*</span></label>
        <input id="name" type="text" autoComplete="name"
               placeholder="กรอกชื่อ-นามสกุล"
               className={cls('name')} {...register('name')} />
        {errors.name && <ErrorRow message={errors.name.message!} />}
      </div>

      {/* org */}
      <div className="field">
        <label className="field__label" htmlFor="org">องค์กร / สังกัด <span className="req">*</span></label>
        <input id="org" type="text"
               placeholder="เช่น พรรคประชาชน, สื่อมวลชน, ภาคประชาสังคม"
               autoComplete="off" spellCheck={false}
               className={cls('org')} {...register('org')} />
        {errors.org && <ErrorRow message={errors.org.message!} />}
      </div>

      {/* type */}
      <div className="field">
        <label className="field__label">ประเภทผู้เข้าร่วม <span className="req">*</span></label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="radio-stack" role="radiogroup">
              {ATTENDEE_TYPES.map((t) => (
                <div key={t.id}
                     role="radio"
                     tabIndex={0}
                     aria-checked={field.value === t.id}
                     className={'radio-card ' + (field.value === t.id ? 'is-active' : '')}
                     onClick={() => field.onChange(t.id)}
                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); field.onChange(t.id); } }}>
                  <div className="radio-card__dot" aria-hidden="true" />
                  <div>
                    <div className="radio-card__label">{t.label}</div>
                    <div className="radio-card__sub">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        />
        {errors.type && <ErrorRow message={errors.type.message!} />}
      </div>

      {/* phone */}
      <div className="field">
        <label className="field__label" htmlFor="phone">เบอร์โทรศัพท์ <span className="req">*</span></label>
        <input id="phone" type="tel" inputMode="tel" autoComplete="tel"
               placeholder="08x-xxx-xxxx"
               className={cls('phone')} {...register('phone')} />
        {errors.phone && <ErrorRow message={errors.phone.message!} />}
      </div>

      {/* dietary */}
      <div className="field">
        <label className="field__label">
          ข้อจำกัดด้านอาหาร{' '}
          <span style={{ color: 'var(--fg-subtle)', fontSize: 11 }}>(ไม่บังคับ)</span>
        </label>
        <div className="field__hint">เลือกได้มากกว่าหนึ่งข้อ — ช่วยให้ทางร้านเตรียมอาหารได้เหมาะสม</div>
        <Controller
          control={control}
          name="diet"
          render={({ field }) => (
            <div className="check-stack">
              {DIET_OPTIONS.map((d) => {
                const active = field.value.includes(d.id);
                return (
                  <div key={d.id}
                       role="checkbox"
                       tabIndex={0}
                       aria-checked={active}
                       className={'check-card ' + (active ? 'is-active' : '')}
                       onClick={() => toggleDiet(d.id, field.value, field.onChange)}
                       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDiet(d.id, field.value, field.onChange); } }}>
                    <div className="check-card__box"><i className="material-icons">check</i></div>
                    <span className="check-card__label">{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        />
        {showOther && (
          <div style={{ marginTop: 8 }}>
            <input className={cls('dietOther')}
                   placeholder="โปรดระบุข้อจำกัดของท่าน"
                   {...register('dietOther')} />
            {errors.dietOther && <ErrorRow message={errors.dietOther.message!} />}
          </div>
        )}
      </div>

      <div className="submit-row">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <i className="material-icons" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>autorenew</i>
              กำลังส่ง…
            </>
          ) : submitLabel}
        </button>
        <div className="submit-hint">
          ข้อมูลของท่านใช้สำหรับการประสานงานเท่านั้น<br />
          ทางเราจะไม่เผยแพร่ต่อบุคคลภายนอก
        </div>
      </div>
    </form>
  );
}

function toggleDiet(id: DietId, current: DietId[], onChange: (v: DietId[]) => void) {
  let next: DietId[];
  if (id === 'none') {
    next = current.includes('none') ? [] : ['none'];
  } else {
    next = current.filter((d) => d !== 'none');
    next = next.includes(id) ? next.filter((d) => d !== id) : [...next, id];
  }
  onChange(next.length === 0 ? ['none'] : next);
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div className="field__error">
      <i className="material-icons">error_outline</i>{message}
    </div>
  );
}
