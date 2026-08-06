/**
 * Xem mot van ban, cuon toi chunk duoc trich dan va highlight nen vang nhat (Phase 6).
 */
export default async function TrangChiTietVanBan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold">Văn bản {id}</h1>
      <p className="text-sm text-muted-foreground">Sẽ xây ở Phase 6.</p>
    </main>
  );
}
