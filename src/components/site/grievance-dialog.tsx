"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { siteConfig } from "@/lib/site-config";

/**
 * GrievanceDialog
 * ----------------
 * The real submission form the Grievance Redressal legal page has always
 * described ("the grievance form linked from the homepage footer under
 * 'Grievance Redressal', which creates a ticket reference (GDT-XXXXXXXX)")
 * but that never existed in the UI. Posts to the already-built,
 * already-audited `/api/grievance` route (schema, rate limiting, honeypot,
 * DB write, email notification — all pre-existing; this component just
 * gives users a way to reach it).
 *
 * Field set mirrors `grievanceSchema` in `src/app/api/grievance/route.ts`
 * exactly: name, email, subject, description, preferredContact, and an
 * optional order/payment reference — plus the standard hidden honeypot.
 */

const PREFERRED_CONTACTS = ["Email", "WhatsApp"] as const;

const grievanceFormSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100, "Please keep your name under 100 characters."),
  email: z.email("Please enter a valid email address."),
  subject: z
    .string()
    .min(3, "Please give your grievance a short subject.")
    .max(200, "Please keep the subject under 200 characters."),
  reference: z
    .string()
    .max(100, "Please keep the reference under 100 characters.")
    .optional(),
  preferredContact: z
    .string()
    .min(1, "Please select how you'd like to be contacted.")
    .refine(
      (val) => (PREFERRED_CONTACTS as readonly string[]).includes(val),
      "Please select a valid contact method.",
    ),
  description: z
    .string()
    .min(10, "Please add a few more details (at least 10 characters).")
    .max(5000, "Please keep the description under 5000 characters."),
  company_website: z.string().optional(),
});

type GrievanceFormValues = z.infer<typeof grievanceFormSchema>;

export interface GrievanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrievanceDialog({ open, onOpenChange }: GrievanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [ticketReference, setTicketReference] = React.useState<string | null>(
    null,
  );

  const form = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      reference: "",
      preferredContact: "",
      description: "",
      company_website: "",
    },
  });

  // Reset internal state whenever the dialog is closed, so re-opening it
  // starts fresh rather than showing the previous ticket / filled form.
  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setTicketReference(null);
        form.reset();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, form]);

  async function onSubmit(values: GrievanceFormValues) {
    if (values.company_website && values.company_website.length > 0) {
      // Honeypot — behave exactly like the real endpoint's honeypot branch
      // (a plausible-looking reference, no network call).
      setTicketReference(
        `GDT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      );
      form.reset();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        subject: values.subject,
        reference: values.reference?.trim() ? values.reference.trim() : undefined,
        preferredContact: values.preferredContact,
        description: values.description,
        company_website: "",
      };

      const res = await fetch("/api/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: true; reference: string }
        | { ok: false; error?: string; errors?: Record<string, string>; logId?: string }
        | null;

      if (!res.ok || !data || data.ok === false) {
        if (data && data.ok === false && data.errors) {
          for (const [field, message] of Object.entries(data.errors)) {
            if (
              field === "name" ||
              field === "email" ||
              field === "subject" ||
              field === "reference" ||
              field === "preferredContact" ||
              field === "description"
            ) {
              form.setError(field as keyof GrievanceFormValues, { message });
            }
          }
        }
        throw new Error("Network response was not ok");
      }

      setTicketReference(data.reference);
      form.reset();
    } catch {
      toast.error(
        "Something went wrong submitting your grievance. Please try again or email us directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg gap-0 p-0 sm:rounded-2xl"
        aria-describedby="grievance-dialog-description"
      >
        <DialogHeader className="gap-1 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold">
            <span className="brand-text-gradient">Grievance Redressal</span>
          </DialogTitle>
          <DialogDescription
            id="grievance-dialog-description"
            className="text-xs text-muted-foreground"
          >
            {ticketReference
              ? "Your grievance has been logged."
              : `Tell us what went wrong. We acknowledge every grievance within 1–2 business days and aim to resolve it within 7.`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          {ticketReference ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-brand-mint text-brand-navy">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                Grievance received ✓
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Our Grievance Officer, {siteConfig.contact.grievanceOfficerName},
                will review this and follow up using your preferred contact
                method.
              </p>
              <p className="text-xs text-muted-foreground">
                Ticket reference:{" "}
                <span className="font-mono font-medium text-foreground">
                  {ticketReference}
                </span>
              </p>
              <Button
                type="button"
                className="mt-2 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground" htmlFor="grievance-name">
                          Full name
                        </FormLabel>
                        <FormControl>
                          <Input id="grievance-name" placeholder="Your name" autoComplete="name" {...field} />
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
                        <FormLabel className="text-xs font-medium text-muted-foreground" htmlFor="grievance-email">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input id="grievance-email" type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground" htmlFor="grievance-subject">
                        Subject
                      </FormLabel>
                      <FormControl>
                        <Input id="grievance-subject" placeholder="Short summary of the issue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground" htmlFor="grievance-reference">
                          Booking / payment reference (optional)
                        </FormLabel>
                        <FormControl>
                          <Input id="grievance-reference" placeholder="e.g. GDB-XXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground" htmlFor="grievance-preferredContact">
                          Preferred contact
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger id="grievance-preferredContact" className="w-full">
                              <SelectValue placeholder="Select one" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PREFERRED_CONTACTS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
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
                      <FormLabel className="text-xs font-medium text-muted-foreground" htmlFor="grievance-description">
                        What happened?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="grievance-description"
                          rows={4}
                          placeholder="Describe the issue — the more detail, the faster we can help."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-2 gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit grievance"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GrievanceDialog;
