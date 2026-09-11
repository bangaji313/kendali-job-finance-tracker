"use client";

import { useActionState } from "react";
import { BellPlus } from "lucide-react";
import { createReminder, updateApplicationStage, type ActionState } from "@/app/actions";
import { applicationStages, stageLabels, type ApplicationStage } from "@/lib/domain/types";

const initial: ActionState = { status: "idle", message: "" };

export function StageControl({ applicationId, currentStage }: { applicationId: string; currentStage: ApplicationStage }) {
  const [state, action, pending] = useActionState(updateApplicationStage, initial);
  return <form action={action} className="form-grid form-grid--2"><input type="hidden" name="applicationId" value={applicationId} /><div className="field"><label htmlFor="application-stage">Tahap lamaran</label><select className="input" id="application-stage" name="stage" defaultValue={currentStage}>{applicationStages.map((stage) => <option value={stage} key={stage}>{stageLabels[stage]}</option>)}</select><span className="field-help">Perubahan dicatat otomatis di aktivitas.</span></div><div><button className="button" type="submit" disabled={pending} data-state={pending ? "loading" : undefined}>{pending ? "Menyimpan" : "Perbarui tahap"}</button><p className="form-status" data-state={state.status} role="status">{state.message}</p></div></form>;
}

export function ReminderForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createReminder, initial);
  return <form action={action} className="form-grid form-grid--2"><input type="hidden" name="applicationId" value={applicationId} /><div className="field"><label htmlFor="reminder-title">Tindakan</label><input className="input" id="reminder-title" name="title" required placeholder="Tindak lanjuti recruiter" /><span className="field-help">Apa yang perlu dilakukan?</span></div><div className="field"><label htmlFor="reminder-due">Waktu</label><input className="input" id="reminder-due" name="dueAt" type="datetime-local" required /><span className="field-help">Mengikuti zona waktu perangkat.</span></div><div><button className="button" type="submit" disabled={pending} data-state={pending ? "loading" : undefined}><BellPlus size={16} />{pending ? "Menyimpan" : "Simpan reminder"}</button><p className="form-status" data-state={state.status} role="status">{state.message}</p></div></form>;
}
