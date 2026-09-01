import type { LoginRequestInput } from "@project/shared";

export type LoginFormValues = LoginRequestInput;

export interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
}
