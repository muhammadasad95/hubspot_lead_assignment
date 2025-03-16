import type { InsertLead, InsertAgent } from "@shared/schema";
import { Client } from "@hubspot/api-client";

export class HubSpotClient {
  private client: Client;

  constructor(accessToken: string) {
    this.client = new Client({ accessToken });
  }

  async getUnassignedLeads(): Promise<InsertLead[]> {
    const { results } = await this.client.crm.contacts.searchApi.doSearch({
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
    });

    return results.map((contact) => ({
      hubspotId: contact.id,
      name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
      email: contact.properties.email,
      company: contact.properties.company || null,
      source: contact.properties.lead_source || null,
      metadata: contact.properties,
    }));
  }

  async getAgents(): Promise<InsertAgent[]> {
    const { results } = await this.client.crm.owners.ownersApi.getPage();

    return results.map((owner) => ({
      name: owner.firstName && owner.lastName 
        ? `${owner.firstName} ${owner.lastName}`.trim()
        : owner.email.split('@')[0],
      email: owner.email,
      specialties: [], // HubSpot doesn't have a direct equivalent, we'll maintain this locally
    }));
  }

  async updateLeadAssignment(hubspotId: string, agentEmail: string): Promise<void> {
    await this.client.crm.contacts.basicApi.update(hubspotId, {
      properties: {
        hs_lead_status: "ASSIGNED",
        assigned_agent_email: agentEmail,
      },
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