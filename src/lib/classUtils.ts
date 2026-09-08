import { prisma } from "./prisma";
import { getNow } from "./timeUtils";

export async function generateClassesFromTemplate(template: any, daysAheadLimit: number = 14) {
  let generated = 0;
  const now = await getNow();

  for (let daysAhead = 0; daysAhead < daysAheadLimit; daysAhead++) {
    // Computed entirely in UTC (get/set) rather than local server time: this function
    // runs both from local dev machines and from Vercel's serverless functions against
    // the SAME database, and those environments don't share a timezone. Mixing local-time
    // Date construction here previously made the "same" nominal class (e.g. "10:00") resolve
    // to two different UTC instants depending on which environment generated it, defeating
    // the idempotency check below and leaving orphaned duplicate classes behind.
    const targetDate = new Date(now);
    targetDate.setUTCDate(targetDate.getUTCDate() + daysAhead);

    // JS: 0=Sunday, 1=Monday ... 6=Saturday
    // Template: 1=Monday, 2=Tuesday ... 7=Sunday
    const jsDayOfWeek = targetDate.getUTCDay(); // 0-6
    const templateDayJS = template.dayOfWeek === 7 ? 0 : template.dayOfWeek; // Convert to JS convention

    if (jsDayOfWeek !== templateDayJS) continue;

    // Build exact start/end times
    const [hours, minutes] = template.startTime.split(":").map(Number);
    const startTime = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), hours, minutes, 0, 0)
    );

    const endTime = new Date(startTime.getTime() + template.durationMinutes * 60000);

    // Idempotency: skip if class already exists for this template + date
    const existing = await prisma.gymClass.findFirst({
      where: {
        templateId: template.id,
        startTime: startTime,
      },
    });

    if (existing) continue;

    await prisma.gymClass.create({
      data: {
        gymId: template.gymId,
        name: template.name,
        instructor: template.instructor,
        instructorId: template.instructorId,
        capacity: template.capacity,
        startTime,
        endTime,
        templateId: template.id,
      },
    });

    generated++;
  }

  return generated;
}

/**
 * Same idempotent generation as `generateClassesFromTemplate`, but for many templates at once
 * in exactly 2 queries total (one batched idempotency check, one batched insert) instead of up
 * to 2 queries PER template. Matters once a gym (or the platform across many gyms) has more
 * than a handful of templates — the per-template version does a sequential round-trip for
 * every (template × matching weekday) pair, which doesn't scale and risks a serverless
 * function timeout on a platform-wide cron run.
 */
export async function generateClassesFromTemplates(templates: any[], daysAheadLimit: number = 14): Promise<number> {
  if (templates.length === 0) return 0;
  const now = await getNow();

  const candidates: { template: any; startTime: Date; endTime: Date }[] = [];
  for (const template of templates) {
    for (let daysAhead = 0; daysAhead < daysAheadLimit; daysAhead++) {
      const targetDate = new Date(now);
      targetDate.setUTCDate(targetDate.getUTCDate() + daysAhead);

      const jsDayOfWeek = targetDate.getUTCDay();
      const templateDayJS = template.dayOfWeek === 7 ? 0 : template.dayOfWeek;
      if (jsDayOfWeek !== templateDayJS) continue;

      const [hours, minutes] = template.startTime.split(":").map(Number);
      const startTime = new Date(
        Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), hours, minutes, 0, 0)
      );
      const endTime = new Date(startTime.getTime() + template.durationMinutes * 60000);
      candidates.push({ template, startTime, endTime });
    }
  }

  if (candidates.length === 0) return 0;

  // Batched idempotency check: one query covering every candidate instead of one per candidate.
  const templateIds = [...new Set(candidates.map((c) => c.template.id))];
  const existing = await prisma.gymClass.findMany({
    where: {
      templateId: { in: templateIds },
      startTime: { in: candidates.map((c) => c.startTime) },
    },
    select: { templateId: true, startTime: true },
  });
  const existingKeys = new Set(existing.map((e) => `${e.templateId}|${e.startTime.toISOString()}`));

  const toCreate = candidates.filter((c) => !existingKeys.has(`${c.template.id}|${c.startTime.toISOString()}`));
  if (toCreate.length === 0) return 0;

  await prisma.gymClass.createMany({
    data: toCreate.map((c) => ({
      gymId: c.template.gymId,
      name: c.template.name,
      instructor: c.template.instructor,
      instructorId: c.template.instructorId,
      capacity: c.template.capacity,
      startTime: c.startTime,
      endTime: c.endTime,
      templateId: c.template.id,
    })),
  });

  return toCreate.length;
}
