import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { verifyRequestSchema } from "@project/shared";
import { Button, Input } from "../../ui";
import { useVerifyMutation } from "../../../hooks/useVerifyMutation";
import { useLoginMutation } from "../../../hooks/useLoginMutation";
import { useToast } from "../../../hooks/useToast";
import type { TwoFaFormValues, TwoFaScreenProps } from "../../../types/twofa";

const RESEND_COOLDOWN_SECONDS = 30;

export function TwoFaScreen({ email, onVerifySuccess }: TwoFaScreenProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const verifyMutation = useVerifyMutation();
  const resendMutation = useLoginMutation();
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, handleSubmit, formState } = useForm<TwoFaFormValues>({
    resolver: zodResolver(verifyRequestSchema.pick({ code: true })),
  });
  const codeField = register("code");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function onSubmit(values: TwoFaFormValues) {
    verifyMutation.mutate(
      { email, code: values.code },
      {
        onSuccess: onVerifySuccess,
        onError: () => showToast(t("twofa.invalidCode"), "error"),
      },
    );
  }

  function onInvalid() {
    showToast(t("twofa.invalidCode"), "error");
  }

  function handleResend() {
    resendMutation.mutate(email, {
      onSuccess: () => {
        showToast(t("twofa.resendSuccess"), "success");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      },
      onError: () => showToast(t("twofa.resendError"), "error"),
    });
  }

  const resendDisabled = resendMutation.isPending || resendCooldown > 0;

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">{t("twofa.title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("twofa.codeSentTo", { email })}</p>

        <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex w-full flex-col gap-3">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="text-center text-xl tracking-[0.5em]"
            label={t("twofa.codeLabel")}
            error={formState.errors.code?.message && t(formState.errors.code.message)}
            {...codeField}
            onChange={(event) => {
              event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
              void codeField.onChange(event);
            }}
          />
          <Button type="submit" variant="primary" className="w-full" disabled={verifyMutation.isPending}>
            {t("twofa.submit")}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={resendDisabled}
          className="h-auto bg-transparent px-1 py-0 text-sm font-normal text-violet-600 hover:bg-transparent hover:underline disabled:text-slate-400 dark:text-violet-400 dark:hover:bg-transparent dark:disabled:text-slate-500"
        >
          {resendCooldown > 0 ? t("twofa.resendCooldown", { seconds: resendCooldown }) : t("twofa.resend")}
        </Button>
      </div>
    </div>
  );
}
