"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Loader2,
  Mail,
  UserCheck,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "@/components/site/section-heading";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Contact section (audit Part 8).
 *
 * Premium two-column liquid-glass panel:
 *   - LEFT: SectionHeading + Email + WhatsApp contact cards.
 *   - RIGHT: form card.
 *
 * Heading: "Let's get you unstuck."
 * Description: "Tell us what you're working on and we'll help you find the right support."
 *
 * Form button: "Find My Tutor →"
 *
 * Success state (per audit Part 8):
 *   "Request received ✓"
 *   "Thanks. We'll review your requirements and get back to you shortly."
 *   "A suitable tutor will be assigned based on your subject and requirements."
 *
 * Form security (audit Part 32):
 *   - Client + server Zod validation.
 *   - Honeypot field (hidden, must stay empty).
 *   - Submit disabled while submitting (no double-submit).
 *   - Server returns a reference; we display it for the user's records.
 */

const supportTypeOptions = [
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

const educationLevelOptions = [
  "High School",
  "Undergraduate",
  "Postgraduate",
  "Other",
] as const;

const contactSchema = z.object({
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
  subject: z
    .string()
    .min(1, "Please tell us what you need help with.")
    .max(200, "Please keep the subject under 200 characters."),
  supportType: z
    .string()
    .min(1, "Please select a type of support.")
    .refine(
      (val) => (supportTypeOptions as readonly string[]).includes(val),
      "Please select a valid support type.",
    ),
  educationLevel: z
    .string()
    .min(1, "Please select your education level.")
    .refine(
      (val) => (educationLevelOptions as readonly string[]).includes(val),
      "Please select a valid education level.",
    ),
  description: z
    .string()
    .min(10, "Please add a few more details (at least 10 characters).")
    .max(2000, "Please keep your message under 2000 characters."),
  // Honeypot.
  company_website: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const inputClassName =
  "rounded-xl border border-border bg-card/70 px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--brand-blue)_40%,transparent)] focus-visible:border-[color-mix(in_oklch,var(--brand-blue)_40%,transparent)]";
const labelClassName = "text-xs font-medium text-muted-foreground";

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const whatsappUrl = getWhatsappUrl();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      whatsapp: "",
      subject: "",
      supportType: "",
      educationLevel: "",
      description: "",
      company_website: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    // Honeypot.
    if (values.company_website && values.company_website.length > 0) {
      const fakeRef = `GDS-SPAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setReference(fakeRef);
      form.reset();
      return;
    }

    const payload = {
      fullName: values.fullName,
      email: values.email,
      whatsapp: values.whatsapp,
      country: "",
      subject: values.subject,
      supportType: values.supportType,
      educationLevel: values.educationLevel,
      description: values.description,
      company_website: "",
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data =
        (await res.json().catch(() => null)) as
          | { ok: true; reference: string }
          | { ok: false; error?: string; errors?: Record<string, string>; logId?: string }
          | null;

      if (!res.ok || !data || data.ok === false) {
        if (data && data.ok === false && data.errors) {
          for (const [field, message] of Object.entries(data.errors)) {
            if (
              field === "fullName" ||
              field === "email" ||
              field === "whatsapp" ||
              field === "subject" ||
              field === "supportType" ||
              field === "educationLevel" ||
              field === "description"
            ) {
              form.setError(field as keyof ContactFormValues, { message });
            }
          }
        }
        throw new Error("Network response was not ok");
      }

      setReference(data.reference);
      form.reset();
    } catch {
      toast.error(
        "Something went wrong. Please try again or email us directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Two-column liquid-glass panel */}
        <div className="liquid-glass rounded-3xl p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
            {/* LEFT: heading + contact methods */}
            <div className="flex flex-col gap-6">
              <SectionHeading
                eyebrow="Contact GetSetGrades"
                number="10"
                align="left"
                headingId="contact-heading"
                title={
                  <>
                    Let&apos;s get you{" "}
                    <span className="brand-text-gradient">unstuck</span>.
                  </>
                }
                subtitle="Tell us what you're working on. We'll understand your requirements and connect you with the right support."
              />

              <div className="flex flex-col gap-3">
                {/* Email */}
                <div className="liquid-glass-pill flex items-center gap-3 rounded-2xl p-4">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        "color-mix(in oklch, var(--brand-blue) 15%, transparent)",
                      color: "var(--brand-blue)",
                    }}
                  >
                    <Mail className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {siteConfig.contact.email}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="link" className="rounded-full">
                    <a href={`mailto:${siteConfig.contact.email}`}>Email Us</a>
                  </Button>
                </div>

                {/* WhatsApp */}
                <div className="liquid-glass-pill flex items-center gap-3 rounded-2xl p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <WhatsAppIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      WhatsApp
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {siteConfig.contact.whatsappDisplay}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="link" className="rounded-full">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat on WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                Usually responds within a few hours
              </span>
            </div>

            {/* RIGHT: form */}
            <div className="lg:col-span-2">
              {reference ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center"
                >
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-brand-mint text-brand-navy">
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Request received ✓
                  </h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Thanks. We&apos;ll review your requirements and get back to
                    you shortly. A suitable tutor will be assigned based on your
                    subject and requirements.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reference ID:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {reference}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full"
                    >
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsAppIcon className="size-4" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                    <Button asChild size="lg" className="rounded-full bg-brand-navy text-white hover:bg-brand-blue">
                      <a href="#top">
                        <Home className="size-4" />
                        Back to Home
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                    noValidate
                  >
                    {/* Honeypot */}
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden"
                      {...form.register("company_website")}
                    />

                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      Tell us what you need.
                    </h3>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClassName} htmlFor="support-fullName">
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="support-fullName"
                                placeholder="Your name"
                                autoComplete="name"
                                className={inputClassName}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClassName} htmlFor="support-email">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="support-email"
                                type="email"
                                inputMode="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={inputClassName}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClassName} htmlFor="support-whatsapp">
                              WhatsApp
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="support-whatsapp"
                                inputMode="tel"
                                placeholder="+91 92176 14813"
                                autoComplete="tel"
                                className={inputClassName}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClassName} htmlFor="support-subject">
                              Subject / Topic
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="support-subject"
                                placeholder="e.g. Quadratic equations, Python loops, research essay…"
                                className={inputClassName}
                                maxLength={200}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClassName} htmlFor="support-supportType">
                              Type of Support
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  id="support-supportType"
                                  className={cn(inputClassName, "w-full")}
                                >
                                  <SelectValue placeholder="Select a type of support" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {supportTypeOptions.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="educationLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClassName} htmlFor="support-educationLevel">
                              Education Level
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  id="support-educationLevel"
                                  className={cn(inputClassName, "w-full")}
                                >
                                  <SelectValue placeholder="Select your level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {educationLevelOptions.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName} htmlFor="support-description">
                            Description — what do you need help with?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              id="support-description"
                              placeholder="Tell us what you're working on, your goals, and what you'd like support with…"
                              rows={5}
                              maxLength={2000}
                              className={inputClassName}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <p className="ml-auto text-xs text-muted-foreground">
                              {field.value?.length ?? 0}/2000 characters
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="group w-full rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-blue sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Finding your support…
                        </>
                      ) : (
                        <>
                          <UserCheck className="size-4" />
                          Find My Tutor
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
