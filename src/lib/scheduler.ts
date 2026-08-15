/**
 * Minimal timer helpers — deliberately without a cron dependency.
 *
 * The adapter only needs "every day at HH:MM" and "every hour at :MM". Both are
 * implemented by computing the next occurrence and re-arming after each fire,
 * which also keeps them correct across daylight saving time changes.
 */

export type TimerHandle = {
  cancel: () => void;
};

type TimeoutFn = (cb: () => void, ms: number) => any;
type ClearFn = (handle: any) => void;

/**
 *
 */
export interface SchedulerHost {
  setTimeout: TimeoutFn;
  /**
   *
   */
  clearTimeout: ClearFn;
}

/**
 * Milliseconds until the next occurrence of `hour:minute` in local time.
 *
 * @param hour
 * @param minute
 * @param now
 */
export function msUntilDaily(
  hour: number,
  minute: number,
  now: Date = new Date(),
): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  );
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * Milliseconds until the next occurrence of :minute in local time.
 *
 * @param minute
 * @param now
 */
export function msUntilHourly(minute: number, now: Date = new Date()): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    minute,
    0,
    0,
  );
  if (next.getTime() <= now.getTime()) {
    next.setHours(next.getHours() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * Runs `callback` every day at the given local time.
 *
 * @param host
 * @param hour
 * @param minute
 * @param callback
 */
export function scheduleDaily(
  host: SchedulerHost,
  hour: number,
  minute: number,
  callback: () => void,
): TimerHandle {
  let handle: any = null;
  let cancelled = false;

  const arm = (): void => {
    if (cancelled) {
      return;
    }
    handle = host.setTimeout(
      () => {
        arm();
        if (!cancelled) {
          callback();
        }
      },
      msUntilDaily(hour, minute),
    );
  };

  arm();
  return {
    cancel: () => {
      cancelled = true;
      if (handle !== null) {
        host.clearTimeout(handle);
        handle = null;
      }
    },
  };
}

/**
 * Runs `callback` every hour at the given minute.
 *
 * @param host
 * @param minute
 * @param callback
 */
export function scheduleHourly(
  host: SchedulerHost,
  minute: number,
  callback: () => void,
): TimerHandle {
  let handle: any = null;
  let cancelled = false;

  const arm = (): void => {
    if (cancelled) {
      return;
    }
    handle = host.setTimeout(() => {
      arm();
      if (!cancelled) {
        callback();
      }
    }, msUntilHourly(minute));
  };

  arm();
  return {
    cancel: () => {
      cancelled = true;
      if (handle !== null) {
        host.clearTimeout(handle);
        handle = null;
      }
    },
  };
}
