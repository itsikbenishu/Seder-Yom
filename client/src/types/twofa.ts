import type { VerifyRequestInput } from "@project/shared";

export type TwoFaFormValues = Pick<VerifyRequestInput, "code">;

export interface TwoFaScreenProps {
  email: string;
  onVerifySuccess: () => void;
}
