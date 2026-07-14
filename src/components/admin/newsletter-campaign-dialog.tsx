"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, Loader2, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminActionResult } from "@/lib/actions/admin/core";
import type { NewsletterCampaign } from "@/lib/database.types";
import {
  campaignToSimpleForm,
  simpleFormToCampaignPayload,
  type SimpleNewsletterInput,
} from "@/lib/email/newsletter-form";
import { customCampaignEmail } from "@/lib/email/newsletter-templates";

export function NewsletterCampaignDialog({
  title,
  initial,
  action,
  triggerLabel,
}: {
  title: string;
  initial?: NewsletterCampaign;
  action: (values: SimpleNewsletterInput) => Promise<AdminActionResult>;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [values, setValues] = React.useState<SimpleNewsletterInput>(() =>
    campaignToSimpleForm(initial)
  );

  React.useEffect(() => {
    if (open) {
      setValues(campaignToSimpleForm(initial));
      setAdvancedOpen(Boolean(initial?.name && initial.name !== initial.subject));
    }
  }, [open, initial]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.subject.trim() || !values.message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    startTransition(async () => {
      const result = await action(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Saved");
      setOpen(false);
      router.refresh();
    });
  }

  const payload = simpleFormToCampaignPayload(values);
  const preview = customCampaignEmail({
    subject: payload.subject,
    eyebrow: payload.eyebrow,
    heading: payload.heading,
    subhead: payload.subhead,
    body: payload.body,
    cta: { label: payload.cta_label, href: payload.cta_href },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerLabel ? (
          <Button variant="outline" size="sm">
            {triggerLabel === "New campaign" ? (
              <Mail className="size-4" aria-hidden />
            ) : (
              <Pencil className="size-4" aria-hidden />
            )}
            {triggerLabel}
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label={title}>
            <Pencil className="size-4" aria-hidden />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fill in the promo — players get a branded email with a button link.
          </p>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,1fr)_340px]">
          <form onSubmit={submit} className="min-w-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nl-subject">Email subject *</Label>
              <Input
                id="nl-subject"
                placeholder="🎰 50% bonus this weekend — Spinora"
                value={values.subject}
                onChange={(e) => setValues((v) => ({ ...v, subject: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">What they see in their inbox.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nl-heading">Big headline (optional)</Label>
              <Input
                id="nl-heading"
                placeholder="Same as subject if left blank"
                value={values.heading}
                onChange={(e) => setValues((v) => ({ ...v, heading: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nl-message">Promo message *</Label>
              <Textarea
                id="nl-message"
                rows={5}
                placeholder="Get 50% extra on your next deposit this weekend only. Play Fire Kirin, Juwa, and more."
                value={values.message}
                onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nl-cta-label">Button text</Label>
                <Input
                  id="nl-cta-label"
                  value={values.cta_label}
                  onChange={(e) => setValues((v) => ({ ...v, cta_label: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nl-cta-href">Button link</Label>
                <Input
                  id="nl-cta-href"
                  type="url"
                  value={values.cta_href}
                  onChange={(e) => setValues((v) => ({ ...v, cta_href: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nl-segment">Who receives this?</Label>
              <Select
                value={values.segment}
                onValueChange={(v) =>
                  setValues((prev) => ({ ...prev, segment: v === "test" ? "test" : "all" }))
                }
              >
                <SelectTrigger id="nl-segment" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test — send to my email only</SelectItem>
                  <SelectItem value="all">All signed-up players (opted in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 px-0"
              onClick={() => setAdvancedOpen((o) => !o)}
            >
              <ChevronDown
                className={`size-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
              Advanced (optional)
            </Button>
            {advancedOpen && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="nl-name">Internal name (for your list only)</Label>
                <Input
                  id="nl-name"
                  placeholder="Defaults to subject line"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Save campaign
              </Button>
            </DialogFooter>
          </form>

          <div className="min-w-0 hidden sm:block">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Eye className="size-3.5" aria-hidden />
              Preview
            </h3>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              sandbox=""
              className="h-[min(70vh,520px)] w-full rounded-lg border border-border bg-white"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
