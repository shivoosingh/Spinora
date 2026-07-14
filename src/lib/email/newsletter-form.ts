import type { NewsletterCampaign } from "@/lib/database.types";

const DEFAULT_CTA_HREF = "https://spinoracasinos.com/promotions";

export type SimpleNewsletterInput = {
  name: string;
  subject: string;
  heading: string;
  message: string;
  cta_label: string;
  cta_href: string;
  segment: "all" | "test";
};

export function campaignToSimpleForm(c?: NewsletterCampaign): SimpleNewsletterInput {
  return {
    name: c?.name ?? "",
    subject: c?.subject ?? "",
    heading: c?.heading ?? "",
    message: (c?.body ?? "").replace(/<br\s*\/?>/gi, "\n"),
    cta_label: c?.cta_label ?? "Play Now",
    cta_href: c?.cta_href ?? DEFAULT_CTA_HREF,
    segment: c?.segment === "test" ? "test" : "all",
  };
}

export function simpleFormToCampaignPayload(v: SimpleNewsletterInput) {
  const subject = v.subject.trim();
  const heading = (v.heading.trim() || subject).trim();
  const message = v.message.trim();

  return {
    name: v.name.trim() || subject,
    subject,
    eyebrow: "Spinora",
    heading,
    subhead: "",
    body: message.replace(/\n/g, "<br>"),
    cta_label: v.cta_label.trim() || "Play Now",
    cta_href: v.cta_href.trim() || DEFAULT_CTA_HREF,
    stat1_value: "",
    stat1_label: "",
    stat2_value: "",
    stat2_label: "",
    stat3_value: "",
    stat3_label: "",
    segment: v.segment,
  };
}
