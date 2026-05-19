const base = (content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
    <div style="background: #ff5a5f; padding: 24px 32px;">
      <h1 style="margin: 0; color: white; font-size: 22px; letter-spacing: -0.5px;">Airbnb</h1>
    </div>
    <div style="padding: 32px;">
      ${content}
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid #ebebeb; font-size: 12px; color: #999;">
      You received this email because of activity on your Airbnb account.
    </div>
  </div>
`;

// ── Auth ────────────────────────────────────────────────────────────────────────

export function welcomeEmail(name: string): string {
  return base(`
    <h2 style="color: #ff5a5f;">Welcome to Airbnb, ${name}!</h2>
    <p>Your account has been created successfully. Start exploring listings and book your next stay.</p>
    <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin-top:8px;">
      Explore Listings
    </a>
  `);
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return base(`
    <h2>Reset your password</h2>
    <p>Hi ${name}, we received a request to reset your password. Click the button below — this link expires in 1 hour.</p>
    <a href="${resetLink}"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin-top:8px;">
      Reset Password
    </a>
    <p style="color:#999; font-size:13px; margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
  `);
}

// ── Bookings ─────────────────────────────────────────────────────────────────────

export function bookingConfirmedEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalPrice: number,
): string {
  return base(`
    <h2 style="color: #ff5a5f;">Your booking is confirmed!</h2>
    <p>Hi ${guestName}, great news — your stay has been booked successfully.</p>
    <div style="background:#f7f7f7; border-radius:10px; padding:20px; margin:20px 0;">
      <p style="margin:0 0 8px; font-size:17px; font-weight:700;">${listingTitle}</p>
      <p style="margin:0 0 4px; color:#555;">📍 ${location}</p>
      <hr style="border:none; border-top:1px solid #ddd; margin:12px 0;" />
      <table style="width:100%; font-size:14px;">
        <tr><td style="color:#888; padding:4px 0;">Check-in</td><td style="font-weight:600;">${checkIn}</td></tr>
        <tr><td style="color:#888; padding:4px 0;">Check-out</td><td style="font-weight:600;">${checkOut}</td></tr>
        <tr><td style="color:#888; padding:4px 0;">Guests</td><td style="font-weight:600;">${guests}</td></tr>
        <tr><td style="color:#888; padding:4px 0;">Total paid</td><td style="font-weight:700; color:#ff5a5f;">$${totalPrice.toLocaleString()}</td></tr>
      </table>
    </div>
    <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}/bookings"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600;">
      View My Bookings
    </a>
  `);
}

export function bookingCancelledEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string,
): string {
  return base(`
    <h2>Booking Cancelled</h2>
    <p>Hi ${guestName}, your booking has been cancelled.</p>
    <div style="background:#f7f7f7; border-radius:10px; padding:20px; margin:20px 0;">
      <p style="margin:0 0 8px; font-size:16px; font-weight:700;">${listingTitle}</p>
      <table style="width:100%; font-size:14px;">
        <tr><td style="color:#888; padding:4px 0;">Check-in</td><td style="font-weight:600;">${checkIn}</td></tr>
        <tr><td style="color:#888; padding:4px 0;">Check-out</td><td style="font-weight:600;">${checkOut}</td></tr>
      </table>
    </div>
    <p style="color:#555;">We hope to see you book again soon.</p>
    <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600;">
      Browse Listings
    </a>
  `);
}

// ── Listings ─────────────────────────────────────────────────────────────────────

export function listingSubmittedEmail(hostName: string, listingTitle: string): string {
  return base(`
    <h2>Your listing is under review</h2>
    <p>Hi ${hostName}, your listing <strong>"${listingTitle}"</strong> has been submitted and is now pending admin approval.</p>
    <p style="color:#555;">We'll email you as soon as it's reviewed. This usually takes less than 24 hours.</p>
    <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}/host/listings"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin-top:8px;">
      View My Listings
    </a>
  `);
}

export function listingApprovedEmail(hostName: string, listingTitle: string): string {
  return base(`
    <h2 style="color: #16a34a;">Listing Approved!</h2>
    <p>Hi ${hostName}, your listing <strong>"${listingTitle}"</strong> has been approved and is now live for guests to book.</p>
    <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}/host/listings"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin-top:8px;">
      View My Listings
    </a>
  `);
}

export function listingRejectedEmail(hostName: string, listingTitle: string): string {
  return base(`
    <h2>Listing Not Approved</h2>
    <p>Hi ${hostName}, unfortunately your listing <strong>"${listingTitle}"</strong> was not approved at this time.</p>
    <p style="color:#555;">Please review your listing details and resubmit. If you believe this is an error, please contact support.</p>
    <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}/host/listings"
       style="display:inline-block; background:#ff5a5f; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin-top:8px;">
      Edit My Listings
    </a>
  `);
}
