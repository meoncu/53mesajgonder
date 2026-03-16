export const seedData = {
  users: [
    {
      id: 'demo-super-admin',
      email: 'meoncu@gmail.com',
      displayName: 'Super Admin',
      role: 'super_admin',
      isActive: true,
    },
  ],
  groups: [{ id: 'vip', ownerUserId: 'demo-super-admin', name: 'VIP', color: '#0EA5E9', isActive: true }],
};
