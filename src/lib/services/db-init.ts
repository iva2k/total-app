import { getDatabase } from '../dal/dal';
import type { DalConfig, IDatabase, Schema } from '$lib/dal/dal-types';
import { type DatabaseSchemaType, seedDevData, seedProductionData } from '$lib/db-schema';
import { stringifyAnyError } from '$lib/utils/errorUtils';

export async function initializeDatabase(config?: DalConfig, schema?: Schema): Promise<void> {
  let seeded: string | undefined = 'Database file exists. Skipping initialization.';
  async function seed(db: IDatabase<DatabaseSchemaType>, dbPath: string): Promise<void> {
    console.log(`Database file not found. Initializing new database at "${dbPath}"...`);

    try {
      // Perform any initial setup if needed
      // For example, you might want to seed initial data here
      const NODE_ENV = process.env.NODE_ENV ?? 'production'; // 'test', 'development' or 'production'
      if (NODE_ENV === 'development') {
        await seedDevData(db);
        seeded = 'Database file created. Initial data seeded for development environment.';
      } else if (NODE_ENV === 'production') {
        await seedProductionData(db);
        seeded = 'Database file created. Initial data seeded for production environment.';
      } else if (NODE_ENV === 'test') {
        // await seedProductionData(db);
        seeded = 'Database file created. Skipping data seeding for test environment.';
      } else {
        seeded = 'Database file created. Skipping data seeding - Unknown environment.';
      }
    } catch (error) {
      console.error('An error occurred during database initialization:', stringifyAnyError(error));
      seeded = undefined;
      // Rollback the transaction
      // TODO: (when needed) Refactor transactions: await db.rollback();
    }
  }

  const db = await getDatabase<DatabaseSchemaType>(config, schema);
  await db.initialize(seed); // maybe call seed()

  if (seeded) {
    console.log(seeded);
  }
}
