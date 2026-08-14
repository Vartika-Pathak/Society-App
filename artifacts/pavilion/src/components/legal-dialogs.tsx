import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LegalDialogProps {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function LegalDialog({ trigger, title, children }: LegalDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="hover:text-foreground transition-colors">{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function PrivacyDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <LegalDialog trigger={trigger} title="Privacy Policy">
      <p>
        Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <Section title="What we collect">
        Your name, email address, flat number, phone number, and password when you sign up, plus
        anything you choose to add later — your bio, photo, or family members' details. When you use
        specific features, we also collect what those features need to work: visitor names and phone
        numbers for gate entries, descriptions and photos for maintenance or complaint reports, and
        payment confirmations (not full card details — those go straight to our payment processor)
        for maintenance dues, parking passes, and paid amenity bookings.
      </Section>
      <Section title="How we use it">
        Strictly to run the society: verifying who you are, letting the gate confirm a visitor, routing
        maintenance and complaint reports to the right staff, sending you OTPs and notices, and keeping
        the records — audit logs, dues, bookings — that the committee needs to manage the building. We
        don't sell your data, and we don't use it for advertising.
      </Section>
      <Section title="Who can see it">
        Fellow residents can see what's on the public Members directory, if you've chosen to appear
        there. Guards and admins can see what their role needs — flat assignments, visitor entries,
        emergency alerts — nothing more. Payment processing is handled by Stripe; we don't store your
        card details ourselves.
      </Section>
      <Section title="How long we keep it">
        For as long as your account is active, plus a reasonable period afterward for the society's
        financial and safety records (audit logs, payment history, entry logs). You can ask the
        committee to delete personal data that isn't legally or financially required to be kept.
      </Section>
      <Section title="Your choices">
        You can review and correct your details from My Flat, or contact the committee to update
        anything you can't change yourself, request a copy of what we hold on you, or ask a question
        about this policy — reach out at committee@pavilion.example.com.
      </Section>
    </LegalDialog>
  );
}

export function TermsDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <LegalDialog trigger={trigger} title="Terms & Conditions">
      <p>
        Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <Section title="Who this is for">
        Pavilion is for verified residents, household staff they vouch for, guards, and the management
        committee of this building only. Access is granted after the committee confirms you actually
        live here — it isn't open to the public.
      </Section>
      <Section title="Your account">
        Keep your password to yourself and let the committee know if you think someone else has access
        to your account. You're responsible for what happens under your login, including visitor
        entries and maintenance requests you create.
      </Section>
      <Section title="Using the gate and entry features">
        OTPs and standing passes are meant for people you're actually expecting. Sharing them with
        anyone else, or vouching for a visitor you haven't verified, is a breach of these terms and a
        security risk to your neighbors.
      </Section>
      <Section title="Payments">
        Maintenance dues, parking passes, and paid amenities are processed securely through Stripe.
        Amounts shown in the app are final at the time of checkout; refunds for amenity bookings follow
        the committee's cancellation policy, available on request.
      </Section>
      <Section title="Emergency alerts">
        The emergency button is for real emergencies only — it immediately notifies your neighbors, the
        guard, and the admin. Misuse may result in your account being restricted.
      </Section>
      <Section title="Conduct">
        Be respectful in complaints, messages, and anything else you post. The committee may remove
        content or restrict accounts that are abusive, fraudulent, or otherwise break these terms.
      </Section>
      <Section title="Changes">
        We may update these terms or the Privacy Policy as the app changes. Continuing to use Pavilion
        after an update means you accept the new terms. Questions go to
        committee@pavilion.example.com.
      </Section>
    </LegalDialog>
  );
}
