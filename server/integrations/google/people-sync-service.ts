export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
}

export class GooglePeopleSyncService {
  async runFullSync(_ownerUserId: string): Promise<SyncResult> {
    // Phase-1 scaffold: replace with actual Google People API import + sync token flow.
    return { created: 0, updated: 0, skipped: 0, deleted: 0 };
  }

  async runIncrementalSync(_ownerUserId: string, _syncToken: string): Promise<SyncResult> {
    return { created: 0, updated: 0, skipped: 0, deleted: 0 };
  }
}
