import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDataProvider, useGetIdentity, useNotify, useRecordContext } from "ra-core";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { CrmDataProvider } from "../providers/types";
import type { Sale } from "../types";

export function SalesAdminActions() {
  const record = useRecordContext<Sale>();
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const notify = useNotify();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isAdmin = (identity as any)?.administrator;
  // Don't show on your own account — use profile page for self-service
  const isSelf = identity?.id === record?.id;

  const { mutate: resendInvite, isPending: resending } = useMutation({
    mutationFn: () => dataProvider.salesResendInvite(record!.id),
    onSuccess: () => notify("Invitation email resent", { type: "success" }),
    onError: (e: Error) => notify(e.message, { type: "error" }),
  });

  const { mutate: setPasswordMutation, isPending: settingPassword } = useMutation({
    mutationFn: () => dataProvider.salesSetPassword(record!.id, password),
    onSuccess: () => {
      notify("Password updated", { type: "success" });
      setPassword("");
      setConfirm("");
      setPasswordError("");
    },
    onError: (e: Error) => notify(e.message, { type: "error" }),
  });

  const handleSetPassword = () => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    setPasswordMutation();
  };

  if (!record || !isAdmin || isSelf) return null;

  return (
    <Card className="max-w-lg mx-auto mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-normal">
          Admin actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Resend invite */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Resend invitation email</p>
            <p className="text-xs text-muted-foreground">
              Sends a new invite link to {record.email}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resendInvite()}
            disabled={resending}
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            {resending ? "Sending…" : "Resend invite"}
          </Button>
        </div>

        <div className="border-t" />

        {/* Set password */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Set password</p>
            <p className="text-xs text-muted-foreground">
              Directly set a new password for this user
            </p>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="new-password" className="text-xs">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                placeholder="Min. 8 characters"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password" className="text-xs">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setPasswordError(""); }}
                placeholder="Repeat password"
                className="h-8 text-sm"
              />
            </div>
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSetPassword}
            disabled={settingPassword || !password || !confirm}
          >
            <KeyRound className="h-3.5 w-3.5 mr-1.5" />
            {settingPassword ? "Saving…" : "Set password"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
