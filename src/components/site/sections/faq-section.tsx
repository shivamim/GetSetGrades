"use client";

import { Mail } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { WhatsAppIcon, getWhatsappUrl } from "@/components/site/whatsapp";
import { siteConfig } from "@/lib/site-config";

type Faq = { question: string; answer: string };

/**
 * FAQ section (audit Part 9).
 *
 * ONLY positive questions. Negative questions ("Do you complete
 * assignments?", "Do you take exams?", "Do you impersonate students?",
 * "Do you cheat?") are NEVER shown — academic-integrity rules belong in
 * the Acceptable Use legal page only.
 *
 * Questions match the brief's exact list:
 *   What is GetSetGrades?
 *   What subjects do you support?
 *   How does tutoring work?
 *   How will my tutor be assigned?
 *   Can I request help with a specific topic?
 *   Can I get one-to-one support?
 *   How are sessions conducted?
 *   Do you support international students?
 *   How do I book a session?
 *   What payment methods are available?
 *   Is payment secure?
 *   Can I reschedule?
 *   How quickly will you respond?
 *   Can I contact you through WhatsApp?
 *   Do I need an account?
 */
const faqs: Faq[] = [
  {
    question: "What is GetSetGrades?",
    answer:
      "An online tutoring and academic-support service that connects students with personalised help across programming, mathematics, writing, research, data, AI and more.",
  },
  {
    question: "What subjects do you support?",
    answer:
      "Programming and computer science, mathematics, research and projects, homework support, quiz and exam preparation, English and writing, data and AI, and assignment guidance.",
  },
  {
    question: "How does tutoring work?",
    answer:
      "Tell us what you're working on, we review your subject and goals, a suitable tutor is assigned, and you start your session. Simple.",
  },
  {
    question: "How will my tutor be assigned?",
    answer:
      "We review your subject, level and goals, then match you with a tutor who fits. You'll know before your session begins. This is a manual review, not an automated process.",
  },
  {
    question: "Can I request help with a specific topic?",
    answer:
      "Yes. Share the topic, the level, and what you'd like to understand. Your tutor will tailor the session to it.",
  },
  {
    question: "Can I get one-to-one support?",
    answer: "Yes. All sessions are one-to-one and online.",
  },
  {
    question: "How are sessions conducted?",
    answer: "Online, one-to-one, scheduled around your availability.",
  },
  {
    question: "Do you support international students?",
    answer: "Yes. Sessions are online and available worldwide.",
  },
  {
    question: "How do I book a session?",
    answer:
      "Click \"Get Started\" anywhere on the site, fill out the short request form, choose a time, and we'll take it from there.",
  },
  {
    question: "What payment methods are available?",
    answer:
      "Payments are handled securely through our payment provider's hosted checkout. We support international payments in USD.",
  },
  {
    question: "Is payment secure?",
    answer:
      "Yes. Card details are handled by PayPal. We never see or store them. After you pay through the PayPal Payment Link, our team verifies the transaction manually before marking the booking as paid.",
  },
  {
    question: "Can I reschedule?",
    answer:
      "Yes. Email or WhatsApp us at least 24 hours before the session and we'll find a better time. Rescheduling is free.",
  },
  {
    question: "How quickly will you respond?",
    answer:
      "Usually within a few hours, often much faster during the day.",
  },
  {
    question: "Can I contact you through WhatsApp?",
    answer: `Yes. ${siteConfig.contact.whatsappDisplay}. Tap "Chat on WhatsApp" anywhere on the site.`,
  },
  {
    question: "Do I need an account?",
    answer: "No. The request flow works without an account.",
  },
];

export function FaqSection() {
  const whatsappHref = getWhatsappUrl();

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          number="09"
          headingId="faq-heading"
          title="Questions? We've got answers."
          subtitle="Everything you need to know before getting started. Can't find your answer? Reach out any time."
        />

        <Accordion
          type="single"
          collapsible
          className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-8"
        >
          {faqs.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${i}`}
              className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-soft backdrop-blur-sm last:border-b"
            >
              <AccordionTrigger
                id={`faq-${i}-trigger`}
                aria-controls={`faq-${i}-content`}
                className="px-5 text-left text-base font-medium hover:no-underline"
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent
                id={`faq-${i}-content`}
                className="px-5 text-sm/relaxed text-muted-foreground data-[state=open]:rounded-b-2xl data-[state=open]:bg-[color-mix(in_oklch,var(--brand-mint)_10%,transparent)]"
              >
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <ScrollReveal
          as="div"
          delay={80}
          className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold">Still have questions?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;re happy to help — reach out any time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" size="lg" className="rounded-full bg-brand-navy text-white hover:bg-brand-blue">
              <a href={`mailto:${siteConfig.contact.email}`}>
                <Mail className="size-4" />
                Email Us
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default FaqSection;
