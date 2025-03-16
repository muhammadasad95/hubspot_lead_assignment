import { pgTable, text, serial, integer, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  specialties: text("specialties").array().notNull(),
  aiScore: integer("ai_score").notNull().default(0),
  status: text("status").notNull().default("active"),
  totalAssignments: integer("total_assignments").notNull().default(0),
  successfulConversions: integer("successful_conversions").notNull().default(0),
  responseTime: integer("avg_response_time").notNull().default(0), // in minutes
  lastActive: timestamp("last_active"),
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
  convertedAt: timestamp("converted_at"),
  metadata: jsonb("metadata"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  agentId: integer("agent_id").references(() => agents.id).notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  matchScore: integer("match_score").notNull(),
  status: text("status").notNull().default("pending"), // pending, converted, lost
  firstResponseTime: integer("first_response_time"), // in minutes
  totalInteractions: integer("total_interactions").notNull().default(0),
  notes: text("notes"),
});

// New table for historical performance metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id).notNull(),
  date: timestamp("date").notNull(),
  leadsAssigned: integer("leads_assigned").notNull().default(0),
  leadsConverted: integer("leads_converted").notNull().default(0),
  averageResponseTime: integer("average_response_time").notNull().default(0),
  averageMatchScore: decimal("average_match_score").notNull().default('0'),
  totalInteractions: integer("total_interactions").notNull().default(0),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ 
  id: true,
  aiScore: true,
  totalAssignments: true,
  successfulConversions: true,
  responseTime: true,
  lastActive: true
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  aiScore: true,
  assignedAgentId: true,
  assignedAt: true,
  convertedAt: true
});

export const insertMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;