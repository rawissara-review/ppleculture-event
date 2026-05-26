// rsvp/production/src/lib/schema.ts
// Zod schemas — shared between form validation and API typing.

import { z } from 'zod';

export const ATTENDEE_TYPES = [
  { id: 'mp',    label: 'สส.',              sub: 'สมาชิกสภาผู้แทนราษฎร' },
  { id: 'staff', label: 'ทีมงาน',           sub: 'ที่ปรึกษาและผู้ประสานงาน' },
  { id: 'guest', label: 'แขกผู้มีเกียรติ',     sub: 'แขกที่ได้รับเชิญจากผู้ประสานงาน' },
] as const;

export type AttendeeTypeId = typeof ATTENDEE_TYPES[number]['id'];

// Thai phone: starts with 0 or +66, followed by 8–9 digits.
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
  diet: z.string().trim().max(200, 'ข้อความยาวเกินไป').optional(),
});

export type RsvpFormData = z.infer<typeof rsvpSchema>;

export const seatCountResponseSchema = z.object({
  confirmed: z.number().int().nonnegative(),
  waitlist:  z.number().int().nonnegative(),
  capacity:  z.number().int().positive(),
});
export type SeatCount = z.infer<typeof seatCountResponseSchema>;

export const submitResponseSchema = z.object({
  ok: z.boolean(),
  status: z.enum(['Confirmed', 'Waitlist']),
  reference: z.string(),
  position: z.number().int().positive().optional(),
});
export type SubmitResponse = z.infer<typeof submitResponseSchema>;
