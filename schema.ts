// rsvp/production/src/lib/schema.ts
// Zod schemas — shared between form validation and API typing.

import { z } from 'zod';

export const ATTENDEE_TYPES = [
  { id: 'mp',    label: 'สส.',              sub: 'สมาชิกสภาผู้แทนราษฎร' },
  { id: 'staff', label: 'ทีมงาน',           sub: 'เจ้าหน้าที่และผู้ประสานงาน' },
  { id: 'guest', label: 'แขกผู้มีเกียรติ',     sub: 'แขกรับเชิญพิเศษ' },
] as const;

export type AttendeeTypeId = typeof ATTENDEE_TYPES[number]['id'];

export const DIET_OPTIONS = [
  { id: 'none',    label: 'ไม่มีข้อจำกัด' },
  { id: 'vegan',   label: 'มังสวิรัติ / วีแกน' },
  { id: 'seafood', label: 'แพ้อาหารทะเล' },
  { id: 'nut',     label: 'แพ้ถั่ว' },
  { id: 'other',   label: 'อื่น ๆ (โปรดระบุ)' },
] as const;

export type DietId = typeof DIET_OPTIONS[number]['id'];

// Thai phone: starts with 0 or +66, followed by 8–9 digits.
// Allow dashes and spaces in input; we normalize before checking.
const phoneRegex = /^(\+?66|0)\d{8,9}$/;

export const rsvpSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  org:  z.string().trim().min(1, 'กรุณากรอกองค์กร / สังกัด'),
  type: z.enum(['mp', 'staff', 'guest'], {
    errorMap: () => ({ message: 'กรุณาเลือกประเภทผู้เข้าร่วม' }),
  }),
  phone: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกเบอร์โทรศัพท์')
    .transform((s) => s.replace(/[\s-]/g, ''))
    .refine((s) => phoneRegex.test(s), {
      message: 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 081-234-5678)',
    }),
  diet: z.array(z.enum(['none', 'vegan', 'seafood', 'nut', 'other']))
    .min(1, 'กรุณาเลือกอย่างน้อยหนึ่งตัวเลือก'),
  dietOther: z.string().trim().optional(),
}).superRefine((val, ctx) => {
  if (val.diet.includes('other') && !val.dietOther) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dietOther'],
      message: 'กรุณาระบุข้อจำกัดด้านอาหาร',
    });
  }
});

export type RsvpFormData = z.infer<typeof rsvpSchema>;

// What the Apps Script returns to /exec?count=1
export const seatCountResponseSchema = z.object({
  confirmed: z.number().int().nonnegative(),
  waitlist:  z.number().int().nonnegative(),
  capacity:  z.number().int().positive(),
});
export type SeatCount = z.infer<typeof seatCountResponseSchema>;

// What the Apps Script returns after a POST submission
export const submitResponseSchema = z.object({
  ok: z.boolean(),
  status: z.enum(['Confirmed', 'Waitlist']),
  reference: z.string(),
  position: z.number().int().positive().optional(),
});
export type SubmitResponse = z.infer<typeof submitResponseSchema>;
