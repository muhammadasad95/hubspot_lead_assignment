import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  specialties: text("specialties").array().notNull(),
  aiScore: integer("ai_score").notNull().default(0),
  status: text("status").notNull().default("active"),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  hubspotId: text("hubspot_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  source: text("source"),
  aiScore: integer("ai_score"),
  assignedAgentId: integer("assigned_agent_id").references(() => agents.id),
  assignedAt: timestamp("assigned_at"),
  metadata: jsonb("metadata"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  agentId: integer("agent_id").references(() => agents.id).notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  matchScore: integer("match_score").notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ 
  id: true,
  aiScore: true 
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  aiScore: true,
  assignedAgentId: true,
  assignedAt: true
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Assignment = typeof assignments.$inferSelect;
