export function durationToSeconds(hours = 0, minutes = 0, seconds = 0): number {
  return (
    Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60 + Math.max(0, seconds)
  );
}

export function secondsToDuration(totalSeconds?: number | null): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (!totalSeconds || totalSeconds <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const total = Math.floor(totalSeconds);
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function formatDurationHms(totalSeconds?: number | null): string {
  const { hours, minutes, seconds } = secondsToDuration(totalSeconds);
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function getLiveTrackedSeconds(
  trackedSeconds = 0,
  isTimerActive?: boolean,
  activeTimerStartedAt?: string | null,
): number {
  if (!isTimerActive || !activeTimerStartedAt) {
    return trackedSeconds;
  }
  const started = new Date(activeTimerStartedAt).getTime();
  if (Number.isNaN(started)) {
    return trackedSeconds;
  }
  const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000));
  return trackedSeconds + elapsed;
}

export function hasEstimatedDuration(task: {
  estimatedHours?: number;
  estimatedMinutes?: number;
  estimatedSeconds?: number;
  estimatedDurationSeconds?: number;
}): boolean {
  if (task.estimatedDurationSeconds && task.estimatedDurationSeconds > 0) {
    return true;
  }
  return (
    durationToSeconds(
      task.estimatedHours || 0,
      task.estimatedMinutes || 0,
      task.estimatedSeconds || 0,
    ) > 0
  );
}

export function getEstimatedDurationSeconds(task: {
  estimatedHours?: number;
  estimatedMinutes?: number;
  estimatedSeconds?: number;
  estimatedDurationSeconds?: number;
}): number {
  if (task.estimatedDurationSeconds && task.estimatedDurationSeconds > 0) {
    return task.estimatedDurationSeconds;
  }
  return durationToSeconds(
    task.estimatedHours || 0,
    task.estimatedMinutes || 0,
    task.estimatedSeconds || 0,
  );
}
