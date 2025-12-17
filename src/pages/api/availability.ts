import type { NextApiRequest, NextApiResponse } from "next";
import {
  addDays,
  formatISO,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";
import { prisma } from "@/lib/prisma";

type Slot = {
  start: string;
  end: string;
  status: "open" | "held" | "booked";
};

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_KEY || "";

const isAdmin = (req: NextApiRequest) => {
  const headerToken =
    req.headers["x-admin-token"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  return ADMIN_TOKEN && headerToken === ADMIN_TOKEN;
};

// Generate slots between from/to from availability rules
function generateSlots(
  rules: { dayOfWeek: number; startTime: string; endTime: string }[],
  from: Date,
  to: Date,
): Slot[] {
  const slots: Slot[] = [];
  const days = Math.max(
    1,
    Math.min(60, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))),
  );

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const dow = date.getDay();
    const matches = rules.filter((r) => r.dayOfWeek === dow);

    for (const rule of matches) {
      const [startH, startM] = rule.startTime.split(":").map(Number);
      const [endH, endM] = rule.endTime.split(":").map(Number);
      const startDate = setMinutes(setHours(date, startH), startM);
      const endDate = setMinutes(setHours(date, endH), endM);
      slots.push({
        start: formatISO(startDate),
        end: formatISO(endDate),
        status: "open",
      });
    }
  }

  return slots;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { from, to } = req.query;
    const fromDate = from ? startOfDay(parseISO(String(from))) : startOfDay(new Date());
    const toDate = to ? endOfDay(parseISO(String(to))) : endOfDay(addDays(new Date(), 7));
    try {
      const rules = await prisma.availabilityRule.findMany();
      const blackouts = await prisma.blackout.findMany();
      const bookings = await prisma.booking.findMany({
        where: {
          requestedStart: { not: null },
          status: { notIn: ["DECLINED", "DONE"] },
        },
      });

      const slots = generateSlots(rules, fromDate, toDate)
        .filter((slot) => {
          const slotDate = new Date(slot.start);
          return !blackouts.some(
            (b) =>
              slotDate.toDateString() === new Date(b.date).toDateString(),
          );
        })
        .map((slot) => {
          const isBooked = bookings.some((b) => {
            if (!b.requestedStart || !b.requestedEnd) return false;
            const s = new Date(slot.start).getTime();
            const e = new Date(slot.end).getTime();
            const bs = new Date(b.requestedStart).getTime();
            const be = new Date(b.requestedEnd).getTime();
            return (bs < e && be > s); // overlap
          });
          return { ...slot, status: isBooked ? "booked" : "open" as const };
        });

      return res.status(200).json({ slots });
    } catch (error) {
      console.error("Error fetching availability", error);
      return res.status(500).json({ error: "Failed to fetch availability" });
    }
  }

  if (req.method === "POST") {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { type } = req.body || {};
    try {
      if (type === "rule") {
        const { dayOfWeek, startTime, endTime } = req.body;
        if (
          dayOfWeek === undefined ||
          typeof dayOfWeek !== "number" ||
          !startTime ||
          !endTime
        ) {
          return res
            .status(400)
            .json({ error: "dayOfWeek, startTime, endTime are required" });
        }
        const rule = await prisma.availabilityRule.create({
          data: { dayOfWeek, startTime, endTime },
        });
        return res.status(201).json({ rule });
      }

      if (type === "blackout") {
        const { date, reason } = req.body;
        if (!date) {
          return res.status(400).json({ error: "date is required" });
        }
        const blackout = await prisma.blackout.create({
          data: { date: new Date(date), reason },
        });
        return res.status(201).json({ blackout });
      }

      return res.status(400).json({ error: "Unknown type" });
    } catch (error) {
      console.error("Error creating availability item", error);
      return res.status(500).json({ error: "Failed to create item" });
    }
  }

  if (req.method === "DELETE") {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id, type } = req.query;
    if (!id || typeof id !== "string" || !type || typeof type !== "string") {
      return res.status(400).json({ error: "id and type are required" });
    }
    try {
      if (type === "rule") {
        await prisma.availabilityRule.delete({ where: { id } });
      } else if (type === "blackout") {
        await prisma.blackout.delete({ where: { id } });
      } else {
        return res.status(400).json({ error: "Unknown type" });
      }
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Error deleting availability item", error);
      return res.status(500).json({ error: "Failed to delete item" });
    }
  }

  res.setHeader("Allow", "GET,POST,DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
