import type { Agent, InsertAgent, Lead, InsertLead, Assignment } from "@shared/schema";

export interface IStorage {
  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  listAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;

  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByHubspotId(hubspotId: string): Promise<Lead | undefined>;
  listLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead>;

  // Assignment operations
  createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment>;
  getAssignments(): Promise<Assignment[]>;
  getAssignmentsByAgentId(agentId: number): Promise<Assignment[]>;
}

export class MemStorage implements IStorage {
  private agents: Map<number, Agent>;
  private leads: Map<number, Lead>;
  private assignments: Map<number, Assignment>;
  private currentAgentId: number;
  private currentLeadId: number;
  private currentAssignmentId: number;

  constructor() {
    this.agents = new Map();
    this.leads = new Map();
    this.assignments = new Map();
    this.currentAgentId = 1;
    this.currentLeadId = 1;
    this.currentAssignmentId = 1;
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(
      (agent) => agent.email === email,
    );
  }

  async listAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const newAgent: Agent = { ...agent, id, aiScore: 0, status: "active" };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async updateAgent(id: number, update: Partial<Agent>): Promise<Agent> {
    const agent = await this.getAgent(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    
    const updatedAgent = { ...agent, ...update };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<void> {
    this.agents.delete(id);
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadByHubspotId(hubspotId: string): Promise<Lead | undefined> {
    return Array.from(this.leads.values()).find(
      (lead) => lead.hubspotId === hubspotId,
    );
  }

  async listLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const newLead: Lead = {
      ...lead,
      id,
      aiScore: null,
      assignedAgentId: null,
      assignedAt: null,
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(id: number, update: Partial<Lead>): Promise<Lead> {
    const lead = await this.getLead(id);
    if (!lead) throw new Error(`Lead not found: ${id}`);
    
    const updatedLead = { ...lead, ...update };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  // Assignment operations
  async createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const newAssignment: Assignment = { ...assignment, id };
    this.assignments.set(id, newAssignment);
    return newAssignment;
  }

  async getAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }

  async getAssignmentsByAgentId(agentId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.agentId === agentId,
    );
  }
}

export const storage = new MemStorage();
