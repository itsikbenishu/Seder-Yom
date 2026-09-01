import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { verifyRequestSchema } from "@project/shared";
import { Button, Input } from "../../ui";
import { useVerifyMutation } from "../../../hooks/useVerifyMutation";
import { useToast } from "../../../hooks/useToast";
import type { TwoFaFormValues, TwoFaScreenProps } from "../../../types/twofa";

export function TwoFaScreen({ email, onVerifySuccess }: TwoFaScreenProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const verifyMutation = useVerifyMutation();

  const { register, handleSubmit, formState } = useForm<TwoFaFormValues>({
    resolver: zodResolver(verifyRequestSchema.pick({ code: true })),
  });
  const codeField = register("code");

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
      </div>
    </div>
  );
}
