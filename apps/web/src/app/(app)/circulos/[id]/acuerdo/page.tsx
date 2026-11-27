import { redirect } from "next/navigation";

interface CirculoAcuerdoRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function CirculoAcuerdoPage({
  params,
}: CirculoAcuerdoRedirectProps) {
  const { id } = await params;
  redirect(`/circulos/${id}?acuerdo=1`);
}
