import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supportMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { MessageCircle, Mail, HelpCircle, Clock } from "lucide-react";

export const metadata = supportMetadata;

const faqs = [
  { q: "How do I request a game account?", a: "Create a free account, navigate to your dashboard, and submit a game request. Our team will process it within 24 hours." },
  { q: "How does the VIP program work?", a: "Earn VIP points through game requests and referrals. Points unlock Bronze, Silver, Gold, and Platinum tiers with increasing benefits." },
  { q: "Is live chat available 24/7?", a: "Yes! Use the floating chat widget on any page or visit your dashboard messages for real-time support." },
  { q: "How do referrals work?", a: "Share your unique referral code. When friends sign up, you earn 10 VIP points per referral." },
];

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Support" }]} />

          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Support & <span className="gradient-text">Help Center</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Get help with game accounts, VIP questions, and technical issues. Our team is here 24/7.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {[
              { icon: MessageCircle, title: "Live Chat", desc: "Chat with our support team in real-time", action: "Open Chat", href: "/login" },
              { icon: Mail, title: "Email Support", desc: "support@spinora.com", action: "Send Email", href: "mailto:support@spinora.com" },
              { icon: Clock, title: "Response Time", desc: "Average response under 5 minutes", action: "Learn More", href: "/about" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="text-center hover:glow-purple transition-all">
                  <CardContent className="p-6">
                    <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={item.href}>{item.action}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
