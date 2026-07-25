import React from "react";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

interface CaptchaProps {
  onChange: (token: string | null) => void;
}

export const Captcha = React.forwardRef<ReCAPTCHA, CaptchaProps>(function Captcha({ onChange }, ref) {
  if (!SITE_KEY) {
    return (
      <p className="text-xs text-destructive">
        CAPTCHA isn't configured (missing VITE_RECAPTCHA_SITE_KEY) — signup/login will fail until it's set.
      </p>
    );
  }

  return <ReCAPTCHA ref={ref} sitekey={SITE_KEY} onChange={onChange} />;
});
