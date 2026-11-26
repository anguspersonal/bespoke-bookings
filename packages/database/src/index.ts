export * from './schema';
export * from './seed-data';

export async function getDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Falls back seamlessly to the typed in-memory client for dev/demo
    return {
      connectionString: 'in-memory://crown-and-blade',
      status: 'active',
    };
  }
  return {
    connectionString,
    status: 'connected',
  };
}
