import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { createHubSpotClient } from "./hubspot";
import { scoreAgent, scoreLead, calculateMatchScore } from "./openai";
import { insertAgentSchema } from "@shared/schema";
import axios from "axios";

const api = axios.create({
  baseURL: 'http://0.0.0.0:5000/api',
  timeout: 5000
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Agent routes
  app.get("/api/agents", async (_req, res) => {
    try {
      const agents = await storage.listAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const parsed = insertAgentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid agent data" });
        return;
      }

      const agent = await storage.createAgent(parsed.data);
      const aiScore = await scoreAgent(agent);
      const updatedAgent = await storage.updateAgent(agent.id, { aiScore });
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/agents/sync", async (_req, res) => {
    try {
      const hubspot = await createHubSpotClient();
      const hubspotAgents = await hubspot.getAgents();

      const newAgents = [];
      for (const agent of hubspotAgents) {
        const existingAgent = await storage.getAgentByEmail(agent.email);
        if (!existingAgent) {
          const createdAgent = await storage.createAgent(agent);
          const aiScore = await scoreAgent(createdAgent);
          const scoredAgent = await storage.updateAgent(createdAgent.id, { aiScore });
          newAgents.push(scoredAgent);
        }
      }

      res.json(newAgents);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid agent ID" });
        return;
      }

      await storage.deleteAgent(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      const leads = await storage.listLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/leads/sync", async (_req, res) => {
    try {
      const hubspot = await createHubSpotClient();
      const unassignedLeads = await hubspot.getUnassignedLeads();

      const newLeads = [];
      for (const lead of unassignedLeads) {
        const existingLead = await storage.getLeadByHubspotId(lead.hubspotId);
        if (!existingLead) {
          const createdLead = await storage.createLead(lead);
          const aiScore = await scoreLead(lead);
          const scoredLead = await storage.updateLead(createdLead.id, { aiScore });
          newLeads.push(scoredLead);
        }
      }

      res.json(newLeads);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/assignments", async (_req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/assignments/auto", async (_req, res) => {
    try {
      const leads = await storage.listLeads();
      const agents = await storage.listAgents();

      const unassignedLeads = leads.filter(lead => !lead.assignedAgentId);
      const activeAgents = agents.filter(agent => agent.status === "active");

      if (unassignedLeads.length === 0 || activeAgents.length === 0) {
        res.json([]);
        return;
      }

      const assignments = [];
      for (const lead of unassignedLeads) {
        let bestMatch = { agentId: 0, score: -1 };

        for (const agent of activeAgents) {
          const matchScore = await calculateMatchScore(lead, agent);
          if (matchScore > bestMatch.score) {
            bestMatch = { agentId: agent.id, score: matchScore };
          }
        }

        if (bestMatch.score > 0) {
          try {
            const agent = await storage.getAgent(bestMatch.agentId);
            if (!agent) continue;

            const hubspot = await createHubSpotClient();
            await hubspot.updateLeadAssignment(lead.hubspotId, agent.email);

            const assignment = await storage.createAssignment({
              leadId: lead.id,
              agentId: bestMatch.agentId,
              assignedAt: new Date(),
              matchScore: bestMatch.score,
            });

            await storage.updateLead(lead.id, {
              assignedAgentId: bestMatch.agentId,
              assignedAt: new Date(),
            });

            assignments.push(assignment);
          } catch (error) {
            console.error(`Failed to assign lead ${lead.id}:`, error);
            continue;
          }
        }
      }

      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  return httpServer;
}