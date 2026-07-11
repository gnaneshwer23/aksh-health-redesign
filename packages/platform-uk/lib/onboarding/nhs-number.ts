/**
 * NHS number validation using the standard modulus 11 check.
 * Weights 10–2 applied to the first nine digits; check digit is 11 − (sum mod 11).
 */
export function validateNhsNumber(value: string): boolean {
  const digits = value.replace(/\s/g, "");
  if (!/^\d{10}$/.test(digits)) return false;

  const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * weights[i]!;
  }

  const remainder = sum % 11;
  const check = 11 - remainder;
  if (check === 11) return digits[9] === "0";
  if (check === 10) return false;
  return Number(digits[9]) === check;
}

export async function verifyNhsNumber(value: string): Promise<{
  valid: boolean;
  message: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const valid = validateNhsNumber(value);
  return {
    valid,
    message: valid
      ? "✓ NHS number validated"
      : "Invalid NHS number: check the 10-digit format",
  };
}
