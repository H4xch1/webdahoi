"use client";
import { useParams } from "next/navigation";
import UserForm from "../../_components/UserForm";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <UserForm key={id} role="MURID" userId={id} />;
}
