import type { InsertLead, InsertAgent } from "@shared/schema";

const HUBSPOT_BASE_URL = "https://api.hubapi.com";

export class HubSpotClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${HUBSPOT_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getUnassignedLeads(): Promise<InsertLead[]> {
    const response = await this.request("/crm/v3/objects/contacts/search", {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "hs_lead_status",
                operator: "EQ",
                value: "NEW",
              },
            ],
          },
        ],
        properties: ["firstname", "lastname", "email", "company", "lead_source"],
        limit: 100,
      }),
    });

    return response.results.map((contact: any) => ({
      hubspotId: contact.id,
      name: `${contact.properties.firstname} ${contact.properties.lastname}`.trim(),
      email: contact.properties.email,
      company: contact.properties.company,
      source: contact.properties.lead_source,
      metadata: contact.properties,
    }));
  }

  async getAgents(): Promise<InsertAgent[]> {
    const response = await this.request("/crm/v3/owners", {
      method: "GET",
    });

    return response.map((owner: any) => ({
      name: owner.firstName && owner.lastName 
        ? `${owner.firstName} ${owner.lastName}`.trim()
        : owner.email.split('@')[0],
      email: owner.email,
      specialties: [], // HubSpot doesn't have a direct equivalent, we'll maintain this locally
    }));
  }

  async updateLeadAssignment(hubspotId: string, agentEmail: string): Promise<void> {
    await this.request(`/crm/v3/objects/contacts/${hubspotId}`, {
      method: "PATCH",
      body: JSON.stringify({
        properties: {
          hs_lead_status: "ASSIGNED",
          assigned_agent_email: agentEmail,
        },
      }),
    });
  }
}

export async function createHubSpotClient(): Promise<HubSpotClient> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is required");
  }
  return new HubSpotClient(accessToken);
}