import type { InsertLead, InsertAgent } from "@shared/schema";
import { Client } from "@hubspot/api-client";

export class HubSpotClient {
  private client: Client;

  constructor(accessToken: string) {
    this.client = new Client({ accessToken });
  }

  async getUnassignedLeads(): Promise<InsertLead[]> {
    try {
      const { results } = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "hs_lifecycle_stage",
                operator: "EQ",
                value: "lead"
              }
            ]
          }
        ],
        properties: ["firstname", "lastname", "email", "company", "hs_lead_status"],
        limit: 100,
      });

      return results.map((contact) => ({
        hubspotId: contact.id,
        name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
        email: contact.properties.email,
        company: contact.properties.company || null,
        source: contact.properties.hs_lead_status || null,
        metadata: contact.properties,
      }));
    } catch (error) {
      console.error('HubSpot API Error:', error);
      throw new Error(`Failed to fetch leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAgents(): Promise<InsertAgent[]> {
    try {
      // Fetch team members/owners from HubSpot
      const response = await this.client.crm.owners.ownersApi.getPage(
        undefined, // after
        undefined, // before
        10, // limit
        undefined, // archived
        ["firstName", "lastName", "email", "userId"] // properties
      );

      return response.results
        .filter(owner => owner.email) // Only include owners with email addresses
        .map(owner => ({
          name: owner.firstName && owner.lastName 
            ? `${owner.firstName} ${owner.lastName}`.trim()
            : owner.email!.split('@')[0],
          email: owner.email!,
          specialties: [], // HubSpot doesn't have specialties, we maintain this locally
        }));
    } catch (error) {
      console.error('HubSpot API Error:', error);
      throw new Error(`Failed to fetch agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLeadAssignment(hubspotId: string, agentEmail: string): Promise<void> {
    try {
      await this.client.crm.contacts.basicApi.update(hubspotId, {
        properties: {
          hs_lead_status: "ASSIGNED",
          assigned_agent_email: agentEmail,
        },
      });
    } catch (error) {
      console.error('HubSpot API Error:', error);
      throw new Error(`Failed to update lead assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function createHubSpotClient(): Promise<HubSpotClient> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is required");
  }
  return new HubSpotClient(accessToken);
}