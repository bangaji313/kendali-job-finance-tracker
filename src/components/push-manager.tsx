"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing } from "lucide-react";
import { savePushSubscription } from "@/app/actions";

function base64ToBytes(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = window.atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function PushManager({ enabled }: { enabled: boolean }) {
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => "serviceWorker" in navigator && "PushManager" in window,
    () => false,
  );
  const [status, setStatus] = useState("");

  async function activate() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) { setStatus("VAPID public key belum dikonfigurasi."); return; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setStatus("Izin notifikasi tidak diberikan. Ubah izin situs bila ingin mengaktifkannya."); return; }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(publicKey) });
    const result = await savePushSubscription(subscription.toJSON());
    setStatus(result.message);
  }

  return (
    <div className="notice">
      <BellRing size={20} aria-hidden="true" />
      <div className="notice__body"><strong>Push notification</strong><span className="muted">Izin browser hanya diminta setelah Anda menekan tombol.</span><div className="page-actions"><button type="button" className="button" onClick={activate} disabled={!enabled || !supported}>Aktifkan di perangkat ini</button></div><span className="form-status" role="status">{supported ? status : "Browser ini tidak mendukung Web Push."}</span></div>
    </div>
  );
}
