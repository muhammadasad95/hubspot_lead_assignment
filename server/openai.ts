import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function scoreAgent(agent: {
  name: string;
  specialties: string[];
  email: string;
}): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Score this sales agent from 0-100 based on their specialties and experience. Return only a number.",
        },
        {
          role: "user",
          content: JSON.stringify(agent),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.score;
  } catch (error) {
    throw new Error(`Failed to score agent: ${error.message}`);
  }
}

export async function scoreLead(lead: {
  name: string;
  company?: string;
  source?: string;
  metadata?: any;
}): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Score this lead from 0-100 based on their potential value. Return only a number.",
        },
        {
          role: "user",
          content: JSON.stringify(lead),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.score;
  } catch (error) {
    throw new Error(`Failed to score lead: ${error.message}`);
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
          content: "Calculate a match score from 0-100 between this lead and agent. Return only a number.",
        },
        {
          role: "user",
          content: JSON.stringify({ lead, agent }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.score;
  } catch (error) {
    throw new Error(`Failed to calculate match score: ${error.message}`);
  }
}
