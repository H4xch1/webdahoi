"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { isActivityKind } from "@/lib/kurikulumMonitoringApi";
import ActivityDetail from "../../_components/ActivityDetail";

export default function Page() {
  const { jenis, id } = useParams<{ jenis: string; id: string }>();
  if (!isActivityKind(jenis)) return <section><h1>Kategori tidak valid</h1><Link href="/kurikulum/monitoring">Kembali ke aktivitas</Link></section>;
  return <ActivityDetail key={`${jenis}:${id}`} kind={jenis} id={id} />;
}
