
import type { InsertLead, InsertAgent } from "@shared/schema";
import axios from "axios";
import dotenv from "dotenv"
dotenv.config();
export class HubSpotClient {
  private readonly accessToken = process.env.HUBSPOT_API_KEY;
  private api: ReturnType<typeof axios.create>;

  constructor(accessToken: string) {
    console.log('token ---------', accessToken)
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
            // Fetch leads with selected properties and filters
            const response = await axios.get(
              "https://api.hubapi.com/crm/v3/objects/contacts",
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                  "Content-Type": "application/json",
                },
                params: {
                  // limit,
                  // after,
              properties: ["firstname", "lastname", "email", "company", "hs_lead_status"],

                  // properties: properties.join(","), // Include selected properties
                },
                data: {
                  filterGroups: [
                    {
                      filters: [
                        {
                          propertyName: "lifecyclestage",
                          operator: "EQ",
                          value: "lead", // Filter by lifecycle stage
                        },
                        {
                          propertyName: "calendly_question_4", // Filter leads without an assigned agent
                          operator: "NOT_HAS_PROPERTY",
                        },
                      ],
                    },
                  ],
                },
              }
            );

      return response.data.results.map((contact: any) => ({
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
      const { data } = await axios.get(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        {
          headers: {
            Authorization: `Bearer ${this.accessTokenß}`,
            "Content-Type": "application/json",
          },
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
          },
        }
      );

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
      await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${lead.id}`,
        {
          properties: {
            hs_lead_status: "ASSIGNED",
            assigned_agent_email: agentEmail,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error('HubSpot API Error:', error);
      throw new Error(`Failed to update lead assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function createHubSpotClient(): Promise<HubSpotClient> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is missing. Please add it to your Secrets with the key 'HUBSPOT_ACCESS_TOKEN'.");
  }
  return new HubSpotClient(accessToken);
}
