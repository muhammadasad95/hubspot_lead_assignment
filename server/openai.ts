import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.REPLIT_SECRET_OPENAI_API_KEY 
});

interface AgentScore {
  score: number;
  analysis: {
    communicationSkills: number;
    industryKnowledge: number;
    clientHandling: number;
    responseEfficiency: number;
    strengths: string[];
    areasForImprovement: string[];
  };
}

interface LeadScore {
  score: number;
  analysis: {
    dealPotential: number;
    urgency: number;
    budgetLevel: number;
    conversionLikelihood: number;
    recommendedApproach: string;
  };
}

export async function scoreAgent(agent: {
  name: string;
  specialties: string[];
  email: string;
  totalAssignments?: number;
  successfulConversions?: number;
  responseTime?: number;
}): Promise<AgentScore> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze this sales agent and provide a detailed score and analysis. Include:
          - Overall score (0-100)
          - Communication skills score (0-100)
          - Industry knowledge score based on specialties (0-100)
          - Client handling score (0-100)
          - Response efficiency score (0-100)
          - Key strengths (list)
          - Areas for improvement (list)
          Return as JSON object.`,
        },
        {
          role: "user",
          content: JSON.stringify(agent),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to score agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function scoreLead(lead: {
  name: string;
  company?: string;
  source?: string;
  metadata?: any;
}): Promise<LeadScore> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze this lead and provide a detailed score and analysis. Include:
          - Overall score (0-100)
          - Deal potential (0-100)
          - Urgency level (0-100)
          - Budget level estimation (0-100)
          - Conversion likelihood (0-100)
          - Recommended approach for handling this lead
          Return as JSON object.`,
        },
        {
          role: "user",
          content: JSON.stringify(lead),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to score lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function calculateMatchScore(
  lead: { aiScore: number; metadata?: any },
  agent: { aiScore: number; specialties: string[] },
): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Calculate a match score from 0-100 between this lead and agent. Consider specialties, experience, and past performance. Return only a number.",
        },
        {
          role: "user",
          content: JSON.stringify({ lead, agent }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.score;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to calculate match score: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}