import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { loginRequestSchema } from "@project/shared";
import { Button, Input } from "../../ui";
import { useLoginMutation } from "../../../hooks/useLoginMutation";
import { useToast } from "../../../hooks/useToast";
import type { LoginFormValues, LoginScreenProps } from "../../../types/login";

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const loginMutation = useLoginMutation();

  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginRequestSchema),
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values.email, {
      onSuccess: () => onLoginSuccess(values.email),
      onError: () => showToast(t("login.invalidEmail"), "error"),
    });
  }

  function onInvalid() {
    showToast(t("login.invalidEmail"), "error");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-violet-600" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">{t("login.appName")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("login.tagline")}</p>

        <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex w-full flex-col gap-3">
          <Input
            type="email"
            maxLength={120}
            label={t("login.emailLabel")}
            error={formState.errors.email?.message && t(formState.errors.email.message)}
            {...register("email")}
          />
          <Button type="submit" variant="primary" className="w-full" disabled={loginMutation.isPending}>
            {t("login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
