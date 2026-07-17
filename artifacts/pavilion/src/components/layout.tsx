import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/members", label: "Directory" },
    { href: "/events", label: "Events" },
    { href: "/news", label: "News" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Pavilion
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/join">
                <Button className="rounded-full px-6 font-medium shadow-sm">
                  Join Community
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background absolute w-full animate-in slide-in-from-top-2">
            <nav className="flex flex-col p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-4 text-base font-medium border-b border-border/50 ${
                    location === link.href ? "text-primary" : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-6 pb-2">
                <Link href="/join" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full" size="lg">
                    Join Community
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="font-serif text-xl font-semibold tracking-tight">
                  Pavilion
                </span>
              </Link>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                A warm, welcoming community hub for residents. Connecting neighbors, sharing news, and building a better living experience together.
              </p>
            </div>
            
            <div>
              <h3 className="font-serif font-medium text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/events" className="text-muted-foreground hover:text-primary transition-colors">Events Calendar</Link></li>
                <li><Link href="/news" className="text-muted-foreground hover:text-primary transition-colors">Community News</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Committee</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-serif font-medium text-lg mb-4">Join Us</h3>
              <p className="text-muted-foreground mb-4">
                Are you a resident? Join our digital community to stay updated.
              </p>
              <Link href="/join">
                <Button variant="outline" className="w-full rounded-full hover:bg-primary hover:text-primary-foreground">
                  Apply for Access
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Pavilion Residents' Society. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
