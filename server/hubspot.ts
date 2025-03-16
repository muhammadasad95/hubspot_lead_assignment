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
      const { results } = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "is_agent",
                operator: "EQ",
                value: "true"
              }
            ]
          }
        ],
        properties: ["email", "firstname", "lastname"],
        limit: 100
      });

      return results
        .filter(contact => contact.properties.email)
        .map(contact => ({
          name: contact.properties.firstname && contact.properties.lastname
            ? `${contact.properties.firstname} ${contact.properties.lastname}`.trim()
            : contact.properties.email!.split('@')[0],
          email: contact.properties.email!,
          specialties: [], // We maintain specialties locally
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
  const accessToken = process.env.REPLIT_SECRET_HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is required");
  }
  return new HubSpotClient(accessToken);
}