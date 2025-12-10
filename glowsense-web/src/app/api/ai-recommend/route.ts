import { NextResponse } from "next/server";
import { providersData } from "@/data/providers";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. RETRIEVAL (Simplified RAG)
    // In a real app, you'd use Vector Embeddings (OpenAI + Pinecone) here.
    // For now, we search for matching keywords in bio, role, and specialties.
    const lowerPrompt = prompt.toLowerCase();
    
    const relevantProviders = providersData.filter((provider) => {
      const text = `${provider.name} ${provider.role} ${provider.specialty.join(" ")} ${provider.bio}`.toLowerCase();
      
      // Check if any word from the prompt (longer than 3 chars) appears in the text
      const keywords = lowerPrompt.split(" ").filter((w: string) => w.length > 3);
      return keywords.some((keyword: string) => text.includes(keyword));
    });

    // 2. GENERATION (Simulated LLM Response)
    // In a real app, you'd send `relevantProviders` + `prompt` to OpenAI API.
    
    let message = "";
    
    if (relevantProviders.length > 0) {
      message = `Based on your request for "${prompt}", I found some excellent experts for you:\n\n`;
      
      relevantProviders.forEach(p => {
        message += `• **${p.name}** (${p.role}) - ${p.location}\n`;
        message += `  *Specialties:* ${p.specialty.join(", ")}\n`;
        message += `  "${p.bio}"\n\n`;
      });
      
      message += "Would you like to book an appointment with any of them?";
    } else {
      message = "I couldn't find a specific match in our current database for that request. However, our **Skin Analysis** tool might help identify the exact treatment you need. Would you like to try that?";
    }

    return NextResponse.json({ response: message, providers: relevantProviders });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

