"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { inviteUser, type ActionState } from "@/app/actions";

const initial: ActionState = { status: "idle", message: "" };

export function InviteForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(inviteUser, initial);
  return <form action={action} className="form-grid form-grid--2"><div className="field"><label htmlFor="invite-email">Alamat email</label><input className="input" id="invite-email" name="email" type="email" required disabled={!enabled} placeholder="anggota@domain.com" /><span className="field-help">Penerima mendapat email undangan Supabase.</span></div><div className="field"><label htmlFor="invite-role">Peran</label><select className="input" id="invite-role" name="role" defaultValue="member" disabled={!enabled}><option value="member">Anggota</option><option value="admin">Admin</option></select><span className="field-help">Admin dapat mengelola allowlist.</span></div><div><button className="button" type="submit" disabled={!enabled || pending} data-state={pending ? "loading" : undefined}><Send size={16} />{pending ? "Mengirim" : "Kirim undangan"}</button><p className="form-status" data-state={state.status} role="status">{enabled ? state.message : "Kontrol ini hanya tersedia untuk admin."}</p></div></form>;
}
