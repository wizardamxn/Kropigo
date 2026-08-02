import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const OTP_TTL_MS = 5 * 60 * 1000;
const PHONE_VERIFICATION_TTL = '10m';
const PHONE_VERIFICATION_PURPOSE = 'phone_verification';

interface PhoneVerificationPayload {
  phone: string;
  purpose: typeof PHONE_VERIFICATION_PURPOSE;
}

/**
 * Generates a 6-digit numeric OTP. Not cryptographically hardened by design —
 * it's a short-lived, single-use SMS code, not a secret key.
 */
export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const toE164 = (phone: string): string => `+91${phone}`;

export const sendOtpSms = async (phone: string, otp: string): Promise<void> => {
  await client.messages.create({
    body: `${otp} is your KropiGo verification code. It expires in 5 minutes.`,
    from: env.TWILIO_PHONE_NUMBER,
    to: toE164(phone),
  });
};

/**
 * Short-lived token proving a phone number was OTP-verified, handed to the
 * client after /otp/verify and required by /auth/register so registration
 * can't be completed for a phone number that was never confirmed.
 */
export const signPhoneVerificationToken = (phone: string): string =>
  jwt.sign({ phone, purpose: PHONE_VERIFICATION_PURPOSE }, env.JWT_SECRET, {
    expiresIn: PHONE_VERIFICATION_TTL,
  });

export const verifyPhoneVerificationToken = (token: string, phone: string): boolean => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as PhoneVerificationPayload;
    return decoded.purpose === PHONE_VERIFICATION_PURPOSE && decoded.phone === phone;
  } catch {
    return false;
  }
};
