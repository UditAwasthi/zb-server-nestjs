import { Injectable } from "@nestjs/common";
import { resend } from "../../lib/resend";
import { env } from "../../config/env";
@Injectable()
export class EmailService {

    async sendVerificationEmail(
        email: string,
        otp: string
    ): Promise<void> {
      try{
        const result =
            await resend.emails.send({
                from: env.EMAIL_FROM,
                to: email,
                subject:
                    "Verify Your Email",

                html: `
<div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 420px; margin: 40px auto; padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">

  <!-- Zynon Connected People Vector Art (Blue Theme for Verification) -->
  <div style="margin-bottom: 28px; display: inline-block;">
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      <!-- Connection Lines (Network) -->
      <path d="M 35 45 C 50 25, 90 25, 105 45" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="4 4" />
      <path d="M 35 45 C 70 60, 70 60, 105 45" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="4 4" />
      <path d="M 35 45 L 70 20" stroke="#2563eb" stroke-width="1.5" opacity="0.4" />
      <path d="M 105 45 L 70 20" stroke="#2563eb" stroke-width="1.5" opacity="0.4" />
      
      <!-- Central/Top Node (Zynon Brand Connection) -->
      <circle cx="70" cy="20" r="5" fill="#2563eb" />
      <circle cx="70" cy="20" r="9" stroke="#2563eb" stroke-width="1.5" opacity="0.3" />
      
      <!-- Person Left -->
      <g transform="translate(20, 30)">
        <circle cx="15" cy="12" r="6" fill="#4f46e5" />
        <path d="M 5 32 C 5 22, 25 22, 25 32" fill="#4f46e5" />
      </g>
      
      <!-- Person Right -->
      <g transform="translate(90, 30)">
        <circle cx="15" cy="12" r="6" fill="#06b6d4" />
        <path d="M 5 32 C 5 22, 25 22, 25 32" fill="#06b6d4" />
      </g>

      <!-- App Logo Badge Overlay -->
      <rect x="58" y="42" width="24" height="24" rx="6" fill="#111827" />
      <text x="70" y="59" fill="#ffffff" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">Z</text>
    </svg>
  </div>

  <!-- Branding Tag -->
  <span style="color: #6366f1; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 8px;">
    Welcome to Zynon
  </span>

  <h1 style="margin: 0 0 12px; color: #111827; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
    Verify Email
  </h1>

  <p style="color: #4b5563; margin: 0 0 28px 0; font-size: 15px; line-height: 1.5;">
    Use the OTP below to verify your email address.
  </p>

  <!-- Highlighting Code Box (Blue Theme) -->
  <div style="background: #eff6ff; border: 1px dashed #bfdbfe; border-radius: 12px; padding: 16px 10px; margin-bottom: 28px;">
    <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #2563eb; padding-left: 10px;">
      ${otp}
    </div>
  </div>

  <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
    This OTP expires in <strong style="color: #111827; font-weight: 600;">10 minutes</strong>.
  </p>

  <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;">

  <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
    If you didn't request this, you can safely ignore this email.
  </p>

</div>
`,
            });
         console.log("Email sent:", result);
          }
          catch (error) {
            console.error("Error sending email:", error);
          }
        
    }

    async sendPasswordResetEmail(
        email: string,
        otp: string
    ): Promise<void> {
        const result =
            await resend.emails.send({
                from: env.EMAIL_FROM,
                to: email,
                subject:
                    "Reset Your Password",

                html: `
<div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 420px; margin: 40px auto; padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">

  <!-- Zynon Connected People Vector Art -->
  <div style="margin-bottom: 28px; display: inline-block;">
    <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      <!-- Connection Lines (Network) -->
      <path d="M 35 45 C 50 25, 90 25, 105 45" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="4 4" />
      <path d="M 35 45 C 70 60, 70 60, 105 45" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="4 4" />
      <path d="M 35 45 L 70 20" stroke="#dc2626" stroke-width="1.5" opacity="0.4" />
      <path d="M 105 45 L 70 20" stroke="#dc2626" stroke-width="1.5" opacity="0.4" />
      
      <!-- Central/Top Node (Zynon Brand Connection) -->
      <circle cx="70" cy="20" r="5" fill="#dc2626" />
      <circle cx="70" cy="20" r="9" stroke="#dc2626" stroke-width="1.5" opacity="0.3" />
      
      <!-- Person Left -->
      <g transform="translate(20, 30)">
        <circle cx="15" cy="12" r="6" fill="#4f46e5" />
        <path d="M 5 32 C 5 22, 25 22, 25 32" fill="#4f46e5" />
      </g>
      
      <!-- Person Right -->
      <g transform="translate(90, 30)">
        <circle cx="15" cy="12" r="6" fill="#06b6d4" />
        <path d="M 5 32 C 5 22, 25 22, 25 32" fill="#06b6d4" />
      </g>

      <!-- App Logo Badge Overlay -->
      <rect x="58" y="42" width="24" height="24" rx="6" fill="#111827" />
      <text x="70" y="59" fill="#ffffff" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">Z</text>
    </svg>
  </div>

  <!-- Branding Tag -->
  <span style="color: #6366f1; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 8px;">
    Zynon Security
  </span>

  <h1 style="margin: 0 0 12px; color: #111827; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
    Reset Password
  </h1>

  <p style="color: #4b5563; margin: 0 0 28px 0; font-size: 15px; line-height: 1.5;">
    Use the OTP below to reset your password.
  </p>

  <!-- Highlighting Code Box -->
  <div style="background: #fef2f2; border: 1px dashed #fca5a5; border-radius: 12px; padding: 16px 10px; margin-bottom: 28px;">
    <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #dc2626; padding-left: 10px;">
      ${otp}
    </div>
  </div>

  <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
    This OTP expires in <strong style="color: #111827; font-weight: 600;">10 minutes</strong>.
  </p>

  <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;">

  <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
    If you didn't request this, you can safely ignore this email.
  </p>

</div>
`
            });



     
    }
}