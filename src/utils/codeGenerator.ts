import * as crypto from "crypto";

export const generateSixDigitCode = (): string => {
  const min = 100000;
  const max = 1000000;

  return crypto.randomInt(min, max).toString();
};
