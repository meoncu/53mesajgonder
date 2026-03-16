import Link from 'next/link';

const items = [
  ['Dashboard', '/'],
  ['Contacts', '/contacts'],
  ['Groups', '/groups'],
  ['Templates', '/templates'],
  ['Campaigns', '/campaigns'],
  ['Sync', '/sync'],
  ['Audit Logs', '/audit'],
  ['Admin', '/admin'],
];

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-border p-4">
      <h2 className="mb-4 text-lg font-semibold">Campaign Hub</h2>
      <nav className="space-y-2">
        {items.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-900">
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
