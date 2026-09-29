"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Lock,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { siteConfig, type LegalPageKey } from "@/lib/site-config";

/**
 * BookingDialog — six-step booking flow (audit Part 17).
 *
 *   Step 1: Service        — pick one of 8 services
 *   Step 2: Requirements   — name, email, whatsapp, support type, level, description
 *   Step 3: Timing         — preferred timing, timezone, session length
 *   Step 4: Review         — review the full request before submitting
 *   Step 5: Payment        — agree-to-terms checkbox (UNchecked), then "Continue
 *                            to secure payment →" which POSTs to /api/booking
 *                            and makes the PayPal payment page available after your request is submitted.
 *   Step 6: Confirmation   — reference + "Please complete the payment using
 *                            the secure payment page." (NOT "Payment successful".)
 *
 * Truthful payment wording (audit Parts 16, 17, 41, 42):
 *   - We do NOT mark the booking paid when the user clicks the payment link.
 *   - We say: "Your request has been submitted. Please complete the payment
 *     using the PayPal Payment Link."
 *   - The hosted-checkout URL is public; payment SECRETS live server-side only.
 *
 * Accessibility:
 *   - shadcn Dialog (Radix) provides focus trap, restore, ESC-to-close.
 *   - Each step has a labelled heading and `aria-describedby` where needed.
 *   - The progress indicator is a labelled list.
 *
 * Form security (audit Part 32):
 *   - Client + server Zod validation.
 *   - Honeypot field (`company_website`) is hidden and must remain empty.
 *   - Submit button is disabled while submitting (no double-submit).
 *   - The server returns a reference + payment link; we never trust a
 *     client-supplied payment status.
 */

// ----------------------------------------------------------------
// Constants — MUST match the server-side enums in /api/booking/route.ts
// ----------------------------------------------------------------

const BOOKING_SERVICES = [
  "Assignment Guidance",
  "Programming & Computer Science",
  "Mathematics",
  "Research & Projects",
  "Homework Support",
  "Quiz & Exam Preparation",
  "English & Writing Support",
  "Data & AI",
] as const;

const SUPPORT_TYPES = [
  "Tutoring",
  "Assignment Guidance",
  "Homework Support",
  "Quiz Preparation",
  "Exam Preparation",
  "Programming Help",
  "Mathematics Help",
  "Research / Project Guidance",
  "Data / AI Support",
  "English / Writing Support",
  "Other",
] as const;

const EDUCATION_LEVELS = [
  "High School",
  "Undergraduate",
  "Postgraduate",
  "Other",
] as const;

const SESSION_LENGTHS = ["30 min", "60 min", "90 min", "Custom"] as const;

const STEPS = [
  { num: 1, label: "Service" },
  { num: 2, label: "Requirements" },
  { num: 3, label: "Timing" },
  { num: 4, label: "Review" },
  { num: 5, label: "Payment" },
  { num: 6, label: "Confirmation" },
] as const;

// ----------------------------------------------------------------
// Schema
// ----------------------------------------------------------------

const bookingSchema = z.object({
  service: z.enum(BOOKING_SERVICES, {
    message: "Please select a service.",
  }),
  fullName: z
    .string()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100, "Please keep your name under 100 characters."),
  email: z.email("Please enter a valid email address."),
  whatsapp: z
    .string()
    .regex(
      /^[+\d][\d\s-]{6,20}$/,
      "Please enter a valid WhatsApp number (with country code).",
    ),
  country: z.string().max(80).optional(),
  subject: z.string().max(200).optional(),
  supportType: z.enum(SUPPORT_TYPES, {
    message: "Please select a type of support.",
  }),
  educationLevel: z.enum(EDUCATION_LEVELS, {
    message: "Please select your education level.",
  }),
  description: z.string().max(5000).optional(),
  preferredTiming: z.string().max(100).optional(),
  timezone: z.string().max(80).optional(),
  sessionLength: z.enum(SESSION_LENGTHS).optional(),
  acknowledged: z.literal(true, {
    message: "Please agree to the Terms & Conditions and Refund Policy.",
  }),
  // Honeypot — must remain empty.
  company_website: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------

export interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Open a legal page in the site's LegalModal. */
  onOpenLegal?: (key: LegalPageKey) => void;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export function BookingDialog({ open, onOpenChange, onOpenLegal }: BookingDialogProps) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  const [paymentLink, setPaymentLink] = React.useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: "onChange",
    defaultValues: {
      service: undefined,
      fullName: "",
      email: "",
      whatsapp: "",
      country: "",
      subject: "",
      supportType: undefined,
      educationLevel: undefined,
      description: "",
      preferredTiming: "",
      timezone: "",
      sessionLength: undefined,
      acknowledged: false as unknown as true,
      company_website: "",
    },
  });

  // Reset internal state whenever the dialog is (re)opened.
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setReference(null);
      setPaymentLink(null);
      setIsSubmitting(false);
      // Don't reset form values on open — the user may have closed & reopened.
    }
  }, [open]);

  // ---- Step navigation ---------------------------------------------------

  function next() {
    setStep((s) => (s < 6 ? ((s + 1) as 1 | 2 | 3 | 4 | 5 | 6) : s));
  }
  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5 | 6) : s));
  }

  // Validate the current step before advancing.
  async function validateStep(s: 1 | 2 | 3 | 4 | 5): Promise<boolean> {
    const v = form.getValues();
    if (s === 1) return Boolean(v.service);
    if (s === 2) {
      const ok = await form.trigger(["fullName", "email", "whatsapp", "supportType", "educationLevel"]);
      return ok;
    }
    if (s === 3) return true; // timing fields are optional
    if (s === 4) return true; // review
    if (s === 5) {
      const ok = await form.trigger(["acknowledged"]);
      return ok;
    }
    return true;
  }

  async function handleNext() {
    // Step 6 has no "next" — guard.
    if (step === 6) return;
    const ok = await validateStep(step);
    if (!ok) return;
    next();
  }

  // ---- Submit (step 5 → 6) ----------------------------------------------

  async function handleSubmit() {
    const ok = await form.trigger();
    if (!ok) {
      // Jump back to the first step that has an error.
      // (For simplicity we just go to step 2 — the most likely culprit.)
      setStep(2);
      return;
    }

    const values = form.getValues();

    // Honeypot — silently "succeed" without sending.
    if (values.company_website && values.company_website.length > 0) {
      setReference(`GDB-SPAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
      setPaymentLink(null);
      setStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: values.service,
          fullName: values.fullName,
          email: values.email,
          whatsapp: values.whatsapp,
          country: values.country || undefined,
          subject: values.subject || undefined,
          supportType: values.supportType,
          educationLevel: values.educationLevel,
          description: values.description || undefined,
          preferredTiming: values.preferredTiming || undefined,
          timezone: values.timezone || undefined,
          sessionLength: values.sessionLength,
          acknowledged: true,
          company_website: "",
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: true; reference: string; paymentLink: string | null; paymentStatus: string }
        | { ok: false; error?: string; errors?: Record<string, string>; logId?: string }
        | null;

      if (!res.ok || !data || data.ok === false) {
        if (data && data.ok === false && data.errors) {
          for (const [field, message] of Object.entries(data.errors)) {
            if (field in form.getValues()) {
              form.setError(field as keyof BookingFormValues, { message });
            }
          }
          // Jump to the relevant step.
          const fields = Object.keys(data.errors);
          if (fields.some((f) => ["service"].includes(f))) setStep(1);
          else if (fields.some((f) => ["fullName", "email", "whatsapp", "supportType", "educationLevel"].includes(f))) setStep(2);
          else if (fields.some((f) => ["acknowledged"].includes(f))) setStep(5);
          else setStep(2);
          return;
        }
        toast.error(
          data && data.ok === false && data.error
            ? data.error
            : "Something went wrong. Please try again or email us directly.",
        );
        return;
      }

      setReference(data.reference);
      setPaymentLink(data.paymentLink);
      setStep(6);
    } catch {
      toast.error("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Render helpers ----------------------------------------------------

  const v = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] max-w-2xl overflow-y-auto scrollbar-slim gap-0 p-0 sm:rounded-3xl"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Book a GetSetGrades session
          </DialogTitle>
          <DialogDescription id="booking-dialog-description" className="text-xs text-muted-foreground">
            Tell us what you need. We&apos;ll match you with a suitable tutor and
            get your session moving.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <ol
          className="flex items-center gap-1 overflow-x-auto px-4 py-3 sm:px-6"
          aria-label="Booking step progress"
        >
          {STEPS.map((s, i) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <li key={s.num} className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-medium",
                    isCurrent && "bg-brand-navy text-white",
                    isDone && "bg-brand-mint text-brand-navy",
                    !isCurrent && !isDone && "bg-muted text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? "✓" : s.num}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-xs sm:inline",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="mx-1 h-px w-4 bg-border sm:w-6"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="px-6 py-5">
          {/* Honeypot — hidden from real users, must stay empty. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            {...form.register("company_website")}
          />

          {/* ============================================================ */}
          {/* STEP 1 — Service                                              */}
          {/* ============================================================ */}
          {step === 1 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="text-base font-semibold tracking-tight">
                What do you need help with?
              </legend>
              <p className="text-sm text-muted-foreground">
                Choose the closest match — you can add details in the next step.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BOOKING_SERVICES.map((svc) => {
                  const selected = v.service === svc;
                  return (
                    <label
                      key={svc}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm transition-colors",
                        selected
                          ? "border-brand-blue bg-[color-mix(in_oklch,var(--brand-mint)_25%,transparent)] text-foreground"
                          : "border-border bg-card text-foreground/80 hover:border-foreground/20",
                      )}
                    >
                      <input
                        type="radio"
                        value={svc}
                        {...form.register("service")}
                        className="size-4 accent-brand-blue"
                      />
                      <span className="font-medium">{svc}</span>
                    </label>
                  );
                })}
              </div>
              {form.formState.errors.service && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.service.message as string}
                </p>
              )}
            </fieldset>
          )}

          {/* ============================================================ */}
          {/* STEP 2 — Requirements                                         */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold tracking-tight">
                Your details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-fullName">Full name</Label>
                  <Input
                    id="bk-fullName"
                    autoComplete="name"
                    className="rounded-xl"
                    {...form.register("fullName")}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.fullName.message as string}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-email">Email</Label>
                  <Input
                    id="bk-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="rounded-xl"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.email.message as string}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-whatsapp">WhatsApp</Label>
                  <Input
                    id="bk-whatsapp"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 92176 14813"
                    className="rounded-xl"
                    {...form.register("whatsapp")}
                  />
                  {form.formState.errors.whatsapp && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.whatsapp.message as string}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-country">Country (optional)</Label>
                  <Input
                    id="bk-country"
                    autoComplete="country-name"
                    className="rounded-xl"
                    {...form.register("country")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-supportType">Type of support</Label>
                  <Controller
                    control={form.control}
                    name="supportType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="bk-supportType" className="rounded-xl">
                          <SelectValue placeholder="Select a type of support" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORT_TYPES.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.supportType && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.supportType.message as string}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-educationLevel">Education level</Label>
                  <Controller
                    control={form.control}
                    name="educationLevel"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="bk-educationLevel" className="rounded-xl">
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_LEVELS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.educationLevel && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.educationLevel.message as string}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bk-subject">Subject / topic (optional)</Label>
                <Input
                  id="bk-subject"
                  placeholder="e.g. Quadratic equations, Python loops, research essay…"
                  maxLength={200}
                  className="rounded-xl"
                  {...form.register("subject")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bk-description">
                  What do you need help with? (optional)
                </Label>
                <Textarea
                  id="bk-description"
                  rows={4}
                  maxLength={5000}
                  placeholder="Tell us what you're working on, your goals, and what you'd like support with…"
                  className="rounded-xl"
                  {...form.register("description")}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3 — Timing                                               */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold tracking-tight">
                When works for you?
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-preferredTiming">Preferred timing</Label>
                  <Input
                    id="bk-preferredTiming"
                    placeholder="e.g. Weekday evenings, weekends"
                    maxLength={100}
                    className="rounded-xl"
                    {...form.register("preferredTiming")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bk-timezone">Timezone</Label>
                  <Input
                    id="bk-timezone"
                    placeholder="e.g. IST, GMT, EST"
                    maxLength={80}
                    className="rounded-xl"
                    {...form.register("timezone")}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="bk-sessionLength">Session length</Label>
                  <Controller
                    control={form.control}
                    name="sessionLength"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="bk-sessionLength" className="rounded-xl">
                          <SelectValue placeholder="Select a session length" />
                        </SelectTrigger>
                        <SelectContent>
                          {SESSION_LENGTHS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4 — Review                                               */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold tracking-tight">
                Review your request
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-border bg-card/60 p-4 text-sm sm:grid-cols-2">
                <ReviewRow label="Service" value={v.service} />
                <ReviewRow label="Name" value={v.fullName} />
                <ReviewRow label="Email" value={v.email} />
                <ReviewRow label="WhatsApp" value={v.whatsapp} />
                <ReviewRow label="Country" value={v.country} />
                <ReviewRow label="Subject" value={v.subject} />
                <ReviewRow label="Support type" value={v.supportType} />
                <ReviewRow label="Education level" value={v.educationLevel} />
                <ReviewRow label="Preferred timing" value={v.preferredTiming} />
                <ReviewRow label="Timezone" value={v.timezone} />
                <ReviewRow label="Session length" value={v.sessionLength} />
                <ReviewRow label="Description" value={v.description} full />
              </dl>
              <p className="text-xs text-muted-foreground">
                You can edit anything by going back. We&apos;ll review your
                request and match you with a suitable tutor before the session.
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5 — Payment                                              */}
          {/* ============================================================ */}
          {step === 5 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold tracking-tight">
                Almost there
              </h3>

              {/* Order summary */}
              <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{v.service}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Session length</span>
                  <span className="font-medium text-foreground">
                    {v.sessionLength || "Not specified"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium text-foreground">
                    {siteConfig.payment.currency}
                  </span>
                </div>
                <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  Final pricing is confirmed on the secure payment page. We
                  never see or store your card details.
                </div>
              </div>

              {/* Agree-to-terms — UNCHECKED by default */}
              <Controller
                control={form.control}
                name="acknowledged"
                render={({ field }) => (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="bk-ack"
                      checked={Boolean(field.value)}
                      onCheckedChange={(c) => field.onChange(c === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="bk-ack" className="text-xs leading-relaxed text-muted-foreground">
                      I agree to the{" "}
                      <a
                        href="#legal-terms"
                        onClick={(e) => {
                          if (onOpenLegal) {
                            e.preventDefault();
                            onOpenLegal("terms");
                          }
                        }}
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        Terms &amp; Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="#legal-refund"
                        onClick={(e) => {
                          if (onOpenLegal) {
                            e.preventDefault();
                            onOpenLegal("refund");
                          }
                        }}
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        Refund Policy
                      </a>
                      .
                    </Label>
                  </div>
                )}
              />
              {form.formState.errors.acknowledged && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.acknowledged.message as string}
                </p>
              )}

              <div className="flex items-start gap-2 rounded-2xl bg-[color-mix(in_oklch,var(--brand-mint)_18%,transparent)] p-3 text-xs text-foreground/80">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-brand-navy" aria-hidden="true" />
                <p>
                  Clicking <strong>Continue to secure payment</strong> submits
                  your request and opens our payment provider&apos;s hosted
                  checkout in a new tab. <strong>Your booking is not paid
                  yet</strong> — after you pay on PayPal, our team verifies the payment manually
                  before marking the booking as paid.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 6 — Confirmation                                         */}
          {/* ============================================================ */}
          {step === 6 && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-brand-mint text-brand-navy">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                Your request has been submitted.
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Please complete the payment using PayPal. After you pay, keep your PayPal
                transaction ID so our team can verify the payment against your booking.
              </p>
              {reference && (
                <p className="text-xs text-muted-foreground">
                  Reference ID:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {reference}
                  </span>
                </p>
              )}

              {paymentLink ? (
                <Button
                  asChild
                  size="lg"
                  className="group mt-2 rounded-full bg-brand-navy text-white hover:bg-brand-blue"
                >
                  <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Open secure payment page
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Open the PayPal payment page above to complete payment.
                </p>
              )}

              <p className="mt-4 max-w-md text-xs text-muted-foreground">
                We&apos;ll email you at <strong>{v.email}</strong> with the
                next steps. You can also reach us on WhatsApp at{" "}
                {siteConfig.contact.whatsappDisplay}.
              </p>
            </div>
          )}
        </div>

        {/* Footer / actions */}
        {step < 6 && (
          <DialogFooter className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 1 || isSubmitting}
              className="rounded-full"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="group rounded-full bg-brand-navy text-white hover:bg-brand-blue"
              >
                Continue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !v.acknowledged}
                className="group rounded-full bg-brand-navy text-white hover:bg-brand-blue"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Continue to secure payment
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Small review-row helper
// ----------------------------------------------------------------

function ReviewRow({
  label,
  value,
  full,
}: {
  label: string;
  value?: string;
  full?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", full && "sm:col-span-2")}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">
        {value && value.trim().length > 0 ? value : "—"}
      </dd>
    </div>
  );
}

export default BookingDialog;
