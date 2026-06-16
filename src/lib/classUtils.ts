import { prisma } from "./prisma";
import { getNow } from "./timeUtils";

export async function generateClassesFromTemplate(template: any, daysAheadLimit: number = 14) {
  let generated = 0;
  const now = await getNow();

  for (let daysAhead = 0; daysAhead < daysAheadLimit; daysAhead++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    // JS: 0=Sunday, 1=Monday ... 6=Saturday
    // Template: 1=Monday, 2=Tuesday ... 7=Sunday
    const jsDayOfWeek = targetDate.getDay(); // 0-6
    const templateDayJS = template.dayOfWeek === 7 ? 0 : template.dayOfWeek; // Convert to JS convention

    if (jsDayOfWeek !== templateDayJS) continue;

    // Build exact start/end times
    const [hours, minutes] = template.startTime.split(":").map(Number);
    const startTime = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + template.durationMinutes);

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
