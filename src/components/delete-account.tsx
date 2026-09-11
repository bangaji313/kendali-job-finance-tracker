"use client";

import { useActionState, useState } from "react";
import { deleteOwnAccount, type ActionState } from "@/app/actions";

const initial: ActionState = { status: "idle", message: "" };

export function DeleteAccount({ enabled }: { enabled: boolean }) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteOwnAccount, initial);
  return <form action={action} className="form-grid"><p><a className="button" href="/api/export?scope=all&format=json">Ekspor data dahulu</a></p><div className="field"><label htmlFor="delete-confirmation">Ketik HAPUS AKUN</label><input className="input" id="delete-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={!enabled || pending} /><span className="field-help">Tindakan ini menghapus data terstruktur dan file secara permanen.</span></div><div><button className="button" type="submit" disabled={!enabled || pending || confirmation !== "HAPUS AKUN"} data-state={state.status === "error" ? "error" : pending ? "loading" : undefined}>{pending ? "Menghapus" : "Hapus akun permanen"}</button></div><p className="form-status" data-state={state.status} role="status">{state.message}</p></form>;
}
