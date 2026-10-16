import { repository } from '../db/repository';
import { collegePanelClient } from './collegePanelClient';
import { logger } from '../shared/utils/logger';

export class OutboxProcessor {
  private isProcessing = false;

  async processPending(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }
    this.isProcessing = true;

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const pendingEvents = await repository.getPendingOutboxEvents();
      logger.info({ count: pendingEvents.length }, 'Processing pending lifecycle outbox events');

      for (const event of pendingEvents) {
        processed++;
        const attempts = (event.attempts || 0) + 1;
        const maxAttempts = event.maxAttempts || 3;

        try {
          const res = await collegePanelClient.syncCollegeLifecycle(event.payload);

          if (res.success) {
            succeeded++;
            await repository.updateOutboxEvent(event.id, {
              status: 'SYNCED',
              attempts,
              lastAttemptAt: new Date().toISOString(),
              lastError: null,
            });

            // Mark central college syncStatus as SYNCED
            await repository.updateCollege(event.collegeId, {
              syncStatus: 'SYNCED',
            }).catch(() => {});
          } else {
            failed++;
            const isExhausted = attempts >= maxAttempts;
            await repository.updateOutboxEvent(event.id, {
              status: isExhausted ? 'FAILED' : 'PENDING',
              attempts,
              lastAttemptAt: new Date().toISOString(),
              lastError: res.error || res.message || 'Downstream sync rejected',
            });

            if (isExhausted) {
              await repository.updateCollege(event.collegeId, {
                syncStatus: 'SYNC_FAILED',
              }).catch(() => {});
            }
          }
        } catch (err: any) {
          failed++;
          const isExhausted = attempts >= maxAttempts;
          await repository.updateOutboxEvent(event.id, {
            status: isExhausted ? 'FAILED' : 'PENDING',
            attempts,
            lastAttemptAt: new Date().toISOString(),
            lastError: err.message,
          });

          if (isExhausted) {
            await repository.updateCollege(event.collegeId, {
              syncStatus: 'SYNC_FAILED',
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed during outbox batch processing');
    } finally {
      this.isProcessing = false;
    }

    return { processed, succeeded, failed };
  }

  async reconcileCollege(collegeId: string): Promise<{ reconciled: number }> {
    const events = await repository.getOutboxEventsByCollege(collegeId);
    let reconciled = 0;

    for (const evt of events) {
      if (evt.status === 'FAILED' || evt.status === 'PENDING') {
        await repository.updateOutboxEvent(evt.id, {
          status: 'PENDING',
          attempts: 0,
          lastError: null,
        });
        reconciled++;
      }
    }

    if (reconciled > 0) {
      await this.processPending();
    }

    return { reconciled };
  }
}

export const outboxProcessor = new OutboxProcessor();
