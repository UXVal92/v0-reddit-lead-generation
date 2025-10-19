import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { currentPrompt, feedback } = await request.json()

    if (!feedback || feedback.trim() === "") {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 })
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at refining AI prompts based on user feedback. Your job is to analyze the current prompt and user feedback, then suggest specific improvements to the prompt.

You must respond with valid JSON in this exact format:
{
  "analysis": "Brief analysis of the feedback (2-3 sentences)",
  "suggestedChanges": "Specific changes to make to the prompt (bullet points or paragraphs)",
  "improvedPrompt": "The complete improved version of the prompt (full text)"
}

Be specific and actionable. Focus on addressing the exact issues mentioned in the feedback. The improvedPrompt field should contain the complete, ready-to-use prompt text.`,
          },
          {
            role: "user",
            content: `Current Prompt:
${currentPrompt}

User Feedback:
${feedback}

Please analyze this feedback and suggest improvements to the prompt. Respond with valid JSON only.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] OpenAI API error:", errorData)
      return NextResponse.json({ error: "Failed to analyze prompt with AI" }, { status: response.status })
    }

    const data = await response.json()
    const suggestionText = data.choices[0].message.content

    try {
      const suggestion = JSON.parse(suggestionText)
      return NextResponse.json({ suggestion })
    } catch (parseError) {
      console.error("[v0] Failed to parse OpenAI JSON response:", parseError)
      // Fallback to returning the raw text if JSON parsing fails
      return NextResponse.json({
        suggestion: {
          analysis: "AI response received",
          suggestedChanges: "See improved prompt below",
          improvedPrompt: suggestionText,
        },
      })
    }
  } catch (error) {
    console.error("[v0] Error in analyze-prompt:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
