import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ConfirmDialog } from "../../ui";
import type { SignOutSectionProps } from "../../../types/settings";

export function SignOutSection({ onSignOut }: SignOutSectionProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirm() {
    setConfirmOpen(false);
    onSignOut();
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("settings.signOut.label")}
      </p>
      <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
        <span aria-hidden="true">🚪</span>
        {t("settings.signOut.button")}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title={t("settings.signOut.confirmTitle")}
        body={t("settings.signOut.confirmBody")}
        confirmLabel={t("settings.signOut.confirmButton")}
        cancelLabel={t("common.cancel")}
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
