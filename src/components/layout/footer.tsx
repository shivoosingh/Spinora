import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { SocialLinks } from "@/components/layout/social-links";
import { AnimatedLogo } from "@/components/ui/animated-logo";

const footerLinks = {
  Platform: [
    { href: "/promotions", label: "Promotions" },
    { href: "/vip", label: "VIP Program" },
    { href: "/spin", label: "Spin Wheel" },
    { href: "/about", label: "About Us" },
    { href: "/support", label: "Support" },
  ],
  Account: [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
    { href: "/dashboard", label: "Dashboard" },
  ],
};

interface FooterProps {
  fullWidth?: boolean;
}

export function Footer({ fullWidth = false }: FooterProps) {
  return (
    <footer
      className={`border-t border-border bg-[#0d0d0d] mt-8 ${fullWidth ? "w-full" : ""}`}
    >
      <div
        className={`mx-auto px-4 py-12 sm:px-6 lg:px-8 ${fullWidth ? "max-w-[1600px]" : "max-w-7xl"}`}
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <AnimatedLogo imageSize={32} textClassName="text-lg" className="mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Premium gaming support and account platform. Request game accounts, earn VIP rewards, and get 24/7 live chat support.
            </p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Follow Us
              </p>
              <SocialLinks />
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <SocialLinks className="sm:hidden" />
          <p className="text-xs text-muted-foreground hidden sm:block">
            Premium Gaming Support Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
