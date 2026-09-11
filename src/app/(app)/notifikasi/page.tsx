import { BellOff } from "lucide-react";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader } from "@/components/ui";
import { getWorkspaceData } from "@/lib/data/workspace";
import { completeReminder, snoozeReminder } from "@/app/actions";

export const metadata = { title: "Notifikasi" };

export default async function NotificationsPage() {
  const data = await getWorkspaceData();
  return <><PageHeader eyebrow="Pusat notifikasi" title="Notifikasi" description="Selesaikan atau tunda reminder. Delivery yang gagal akan dicoba ulang tanpa menggandakan notifikasi." />{!data.configured ? <section className="section"><PreviewNotice /></section> : null}<section className="section"><SectionHeader title="Perlu perhatian" description="Reminder pending dan snoozed yang sudah mendekati waktu." />{data.reminders.length === 0 ? <EmptyState title="Tidak ada notifikasi" description="Reminder baru akan muncul saat next action atau jadwal yang Anda buat sudah mendekat." /> : <ul className="queue">{data.reminders.map((reminder) => <li className="queue-item" key={reminder.id}><span className="empty-icon"><BellOff size={16} /></span><div className="queue-item__body"><strong>{reminder.title}</strong><span className="queue-item__meta">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(reminder.dueAt))}</span><div className="page-actions"><form action={completeReminder}><input type="hidden" name="reminderId" value={reminder.id} /><button className="button" type="submit">Selesai</button></form><form action={snoozeReminder}><input type="hidden" name="reminderId" value={reminder.id} /><button className="button button--quiet" type="submit">Tunda 1 hari</button></form></div></div></li>)}</ul>}</section></>;
}
