
import type { InsertLead, InsertAgent } from "@shared/schema";
import axios from "axios";

export class HubSpotClient {
  private accessToken: string;
  private api: ReturnType<typeof axios.create>;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getUnassignedLeads(): Promise<InsertLead[]> {
    try {
      const { data } = await this.api.post('/crm/v3/objects/contacts/search', {
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

      return data.results.map((contact: any) => ({
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
      const { data } = await this.api.get('/crm/v3/objects/contacts', {
        params: {
          properties: ["email", "firstname", "lastname"],
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "is_agent",
                  operator: "EQ",
                  value: "true",
                },
              ],
            },
          ],
        }
      });

      return data.results
        .filter((contact: any) => contact.properties.email)
        .map((contact: any) => ({
          name: contact.properties.firstname && contact.properties.lastname
            ? `${contact.properties.firstname} ${contact.properties.lastname}`.trim()
            : contact.properties.email.split('@')[0],
          email: contact.properties.email,
          specialties: [],
        }));
    } catch (error) {
      console.error('HubSpot API Error:', error);
      throw new Error(`Failed to fetch agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLeadAssignment(hubspotId: string, agentEmail: string): Promise<void> {
    try {
      await this.api.patch(`/crm/v3/objects/contacts/${hubspotId}`, {
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
    throw new Error("REPLIT_SECRET_HUBSPOT_ACCESS_TOKEN environment variable is missing. Please add it to your Secrets with the key 'HUBSPOT_ACCESS_TOKEN'.");
  }
  return new HubSpotClient(accessToken);
}
