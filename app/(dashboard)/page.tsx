const cards = [
  { label: 'Toplam Kişi', value: '0' },
  { label: 'Toplam Grup', value: '0' },
  { label: 'Aktif Campaign', value: '0' },
  { label: 'Son Sync', value: '-' },
  { label: 'Bekleyen Scheduled', value: '0' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
