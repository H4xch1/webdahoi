import { Suspense } from "react";
import MonitoringDashboard from "./_components/MonitoringDashboard";

export default function Page() {
  return <Suspense fallback={<p>Memuat aktivitas guru...</p>}><MonitoringDashboard /></Suspense>;
}
