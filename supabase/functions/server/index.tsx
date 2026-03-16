import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== Health =====
app.get("/make-server-0d50cb12/health", (c) => c.json({ status: "ok" }));

// ===== INIT (seed initial data if empty) =====
app.post("/make-server-0d50cb12/init", async (c) => {
  try {
    const existingStores = await kv.getByPrefix("store:");
    if (existingStores && existingStores.length > 0) {
      return c.json({ initialized: false, message: "Already initialized" });
    }
    const body = await c.req.json();
    const { stores = [], trainers = [], clients = [], sessions = [], exercises = [], courses = [] } = body;
    const pairs: [string, any][] = [];
    for (const s of stores) pairs.push([`store:${s.id}`, s]);
    for (const t of trainers) pairs.push([`trainer:${t.id}`, t]);
    for (const cl of clients) pairs.push([`client:${cl.id}`, cl]);
    for (const s of sessions) pairs.push([`session:${s.id}`, s]);
    for (const e of exercises) pairs.push([`exercise:${e.id}`, e]);
    for (const course of courses) pairs.push([`course:${course.id}`, course]);
    if (pairs.length > 0) await kv.mset(pairs);
    return c.json({ initialized: true, count: pairs.length });
  } catch (e) {
    console.log("Init error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ===== STORES =====
app.get("/make-server-0d50cb12/stores", async (c) => {
  try {
    const stores = await kv.getByPrefix("store:");
    return c.json(stores || []);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post("/make-server-0d50cb12/stores", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || generateId();
    const store = { ...body, id, createdAt: body.createdAt || new Date().toISOString().split('T')[0] };
    await kv.set(`store:${id}`, store);
    return c.json(store, 201);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put("/make-server-0d50cb12/stores/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`store:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id };
    await kv.set(`store:${id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.delete("/make-server-0d50cb12/stores/:id", async (c) => {
  try {
    await kv.del(`store:${c.req.param("id")}`);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== TRAINERS =====
app.get("/make-server-0d50cb12/trainers", async (c) => {
  try {
    const trainers = await kv.getByPrefix("trainer:");
    return c.json(trainers || []);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post("/make-server-0d50cb12/trainers", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || generateId();
    const trainer = { ...body, id, createdAt: body.createdAt || new Date().toISOString().split('T')[0] };
    await kv.set(`trainer:${id}`, trainer);
    return c.json(trainer, 201);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put("/make-server-0d50cb12/trainers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`trainer:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id };
    await kv.set(`trainer:${id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.delete("/make-server-0d50cb12/trainers/:id", async (c) => {
  try {
    await kv.del(`trainer:${c.req.param("id")}`);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== AUTH =====
app.post("/make-server-0d50cb12/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const trainers = await kv.getByPrefix("trainer:");
    const trainer = (trainers || []).find((t: any) =>
      t.email === email && t.password === password && t.active
    );
    if (!trainer) return c.json({ error: "メールアドレスまたはパスワードが正しくありません" }, 401);
    return c.json(trainer);
  } catch (e) {
    console.log("Login error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ===== CLIENTS =====
app.get("/make-server-0d50cb12/clients", async (c) => {
  try {
    const clients = await kv.getByPrefix("client:");
    return c.json(clients || []);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post("/make-server-0d50cb12/clients", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || generateId();
    const client = { ...body, id, createdAt: body.createdAt || new Date().toISOString().split('T')[0] };
    await kv.set(`client:${id}`, client);
    return c.json(client, 201);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put("/make-server-0d50cb12/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`client:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id };
    await kv.set(`client:${id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.delete("/make-server-0d50cb12/clients/:id", async (c) => {
  try {
    await kv.del(`client:${c.req.param("id")}`);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== SESSIONS =====
app.get("/make-server-0d50cb12/sessions", async (c) => {
  try {
    const sessions = await kv.getByPrefix("session:");
    return c.json(sessions || []);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post("/make-server-0d50cb12/sessions", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || generateId();
    const session = { ...body, id, createdAt: body.createdAt || new Date().toISOString() };
    await kv.set(`session:${id}`, session);
    return c.json(session, 201);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put("/make-server-0d50cb12/sessions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`session:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id };
    await kv.set(`session:${id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.delete("/make-server-0d50cb12/sessions/:id", async (c) => {
  try {
    await kv.del(`session:${c.req.param("id")}`);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== EXERCISES =====
app.get("/make-server-0d50cb12/exercises", async (c) => {
  try {
    const exercises = await kv.getByPrefix("exercise:");
    return c.json(exercises || []);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post("/make-server-0d50cb12/exercises", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || generateId();
    const exercise = { ...body, id };
    await kv.set(`exercise:${id}`, exercise);
    return c.json(exercise, 201);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put("/make-server-0d50cb12/exercises/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`exercise:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id };
    await kv.set(`exercise:${id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.delete("/make-server-0d50cb12/exercises/:id", async (c) => {
  try {
    await kv.del(`exercise:${c.req.param("id")}`);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== COURSES =====
app.get("/make-server-0d50cb12/courses", async (c) => {
  try {
    const courses = await kv.getByPrefix("course:");
    return c.json(courses || []);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.post("/make-server-0d50cb12/courses", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || generateId();
    const course = { ...body, id };
    await kv.set(`course:${id}`, course);
    return c.json(course, 201);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.put("/make-server-0d50cb12/courses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`course:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id };
    await kv.set(`course:${id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.delete("/make-server-0d50cb12/courses/:id", async (c) => {
  try {
    await kv.del(`course:${c.req.param("id")}`);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== STATS: Trainers per month =====
app.get("/make-server-0d50cb12/stats/trainers", async (c) => {
  try {
    const month = c.req.query("month") || new Date().toISOString().slice(0, 7);
    const [sessions, trainers] = await Promise.all([
      kv.getByPrefix("session:"),
      kv.getByPrefix("trainer:"),
    ]);
    const monthSessions = (sessions || []).filter((s: any) => s.date?.startsWith(month));
    const stats = (trainers || [])
      .filter((t: any) => t.active)
      .map((trainer: any) => {
        const ts = monthSessions.filter((s: any) => s.trainerId === trainer.id);
        const totalMinutes = ts.reduce((sum: number, s: any) => sum + (s.sessionDurationMinutes || 0), 0);
        return {
          trainerId: trainer.id,
          trainerName: trainer.name,
          role: trainer.role,
          storeIds: trainer.storeIds || [],
          sessionCount: ts.length,
          totalMinutes,
        };
      });
    return c.json(stats);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== STATS: Stores per month =====
app.get("/make-server-0d50cb12/stats/stores", async (c) => {
  try {
    const month = c.req.query("month") || new Date().toISOString().slice(0, 7);
    const [sessions, stores] = await Promise.all([
      kv.getByPrefix("session:"),
      kv.getByPrefix("store:"),
    ]);
    const monthSessions = (sessions || []).filter((s: any) => s.date?.startsWith(month));
    const stats = (stores || [])
      .filter((s: any) => s.active)
      .map((store: any) => {
        const ss = monthSessions.filter((s: any) => s.storeId === store.id);
        const uniqueClients = new Set(ss.map((s: any) => s.clientId)).size;
        const totalMinutes = ss.reduce((sum: number, s: any) => sum + (s.sessionDurationMinutes || 0), 0);
        return {
          storeId: store.id,
          storeName: store.name,
          sessionCount: ss.length,
          uniqueClientCount: uniqueClients,
          totalMinutes,
        };
      });
    return c.json(stats);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

// ===== ALERTS: Inactive clients (2+ weeks no visit) =====
app.get("/make-server-0d50cb12/alerts/inactive", async (c) => {
  try {
    const storeIds = c.req.query("storeIds");
    const [sessions, clients] = await Promise.all([
      kv.getByPrefix("session:"),
      kv.getByPrefix("client:"),
    ]);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const cutoff = twoWeeksAgo.toISOString().split('T')[0];

    let activeClients = (clients || []).filter((c: any) => c.active);
    if (storeIds) {
      const idList = storeIds.split(',');
      activeClients = activeClients.filter((c: any) => idList.includes(c.storeId));
    }

    const allSessions = sessions || [];
    const result = activeClients.map((client: any) => {
      const cs = allSessions
        .filter((s: any) => s.clientId === client.id)
        .sort((a: any, b: any) => b.date.localeCompare(a.date));
      const lastDate = cs[0]?.date || client.startDate;
      const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        clientId: client.id,
        clientName: client.name,
        storeId: client.storeId,
        primaryTrainerId: client.primaryTrainerId,
        lastVisitDate: lastDate,
        daysSince,
        isInactive: lastDate <= cutoff,
      };
    }).filter((c: any) => c.isInactive);

    return c.json(result.sort((a: any, b: any) => b.daysSince - a.daysSince));
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

Deno.serve(app.fetch);
