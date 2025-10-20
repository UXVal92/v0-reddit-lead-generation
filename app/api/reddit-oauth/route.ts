import { createServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

function sendProgress(controller: ReadableStreamDefaultController, message: string, progress: number) {
  const data = JSON.stringify({ message, progress })
  controller.enqueue(`data: ${data}\n\n`)
}

async function processBatch(
  posts: any[],
  customPrompt: string,
  openaiKey: string,
  supabase: any,
  controller: ReadableStreamDefaultController,
  batchSize = 5,
) {
  const results = []
  const totalPosts = posts.length

  // Process posts in batches
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(posts.length / batchSize)

    console.log(`[v0] Processing batch ${batchNumber} of ${totalBatches} (${batch.length} posts)`)

    sendProgress(
      controller,
      `Processing posts ${i + 1}-${Math.min(i + batchSize, totalPosts)} of ${totalPosts}...`,
      Math.round((i / totalPosts) * 100),
    )

    // Process all posts in this batch in parallel
    const batchPromises = batch.map(async (post) => {
      try {
        const postContent = `Title: ${post.title}\nContent: ${post.selftext || "No content"}`

        console.log(`[v0] Processing post ${post.id} with OpenAI...`)

        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: customPrompt,
              },
              {
                role: "user",
                content: `Analyze this Reddit post to determine if this person needs professional financial advice:

${postContent}

Provide:
1. A brief summary focusing on their financial situation and what advice they're seeking (2-3 sentences)
2. A lead score from 1-10 where:
   - 9-10: Clear need for professional adviser (complex situation, significant assets, major life decision)
   - 7-8: Strong candidate (multiple financial concerns, seeking comprehensive guidance)
   - 5-6: Moderate fit (specific question but could benefit from professional input)
   - 3-4: Low priority (simple question, DIY approach preferred)
   - 1-2: Not a good fit (not seeking advice or very basic question)
3. An opportunity explanation (2-3 sentences) specifically for Ascott Lloyd advisers explaining:
   - Why this person would benefit from professional financial advisory services
   - What specific value an Ascott Lloyd adviser could provide
   - The potential for a long-term advisory relationship
4. A helpful, professional reply that:
   - Addresses their specific concern with genuine value
   - Positions you as a knowledgeable financial adviser
   - Offers to discuss their situation further if appropriate
   - Maintains a consultative, not salesy tone

Format your response as:
SUMMARY: [your summary]
SCORE: [number]
OPPORTUNITY: [opportunity explanation for Ascott Lloyd advisers]
REPLY: [your reply]`,
              },
            ],
            temperature: 0.7,
          }),
        })

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json()
          console.error(`[v0] OpenAI API error for post ${post.id}:`, errorData)
          return null
        }

        const openaiData = await openaiResponse.json()
        const text = openaiData.choices[0].message.content

        console.log(`[v0] Successfully processed post ${post.id}`)

        const summaryMatch = text.match(/SUMMARY: (.*?)(?=SCORE:|$)/s)
        const scoreMatch = text.match(/SCORE: (\d+)/)
        const opportunityMatch = text.match(/OPPORTUNITY: (.*?)(?=REPLY:|$)/s)
        const replyMatch = text.match(/REPLY: (.*?)$/s)

        const processedPost = {
          reddit_id: post.id,
          title: post.title,
          content: post.selftext || "",
          subreddit: post.subreddit,
          author: post.author,
          url: `https://reddit.com${post.permalink}`,
          reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
          summary: summaryMatch?.[1]?.trim() || "Summary not available",
          score: scoreMatch ? Number.parseInt(scoreMatch[1]) : 5,
          opportunity: opportunityMatch?.[1]?.trim() || "Opportunity analysis not available",
          draft_reply: replyMatch?.[1]?.trim() || "Reply not available",
        }

        const { error: insertError } = await supabase.from("reddit_leads").insert(processedPost)

        if (insertError) {
          console.error(`[v0] Error saving post ${post.id} to database:`, insertError)
        } else {
          console.log(`[v0] Saved post ${post.id} to database`)
        }

        return {
          id: post.id,
          title: post.title,
          content: post.selftext || "",
          subreddit: post.subreddit,
          author: post.author,
          url: `https://reddit.com${post.permalink}`,
          summary: processedPost.summary,
          score: processedPost.score,
          opportunity: processedPost.opportunity,
          draftReply: processedPost.draft_reply,
          timestamp: processedPost.reddit_created_at,
        }
      } catch (error) {
        console.error(`[v0] Error processing post ${post.id}:`, error)
        return null
      }
    })

    // Wait for all posts in this batch to complete
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.filter((result) => result !== null))

    console.log(
      `[v0] Completed batch ${batchNumber}, processed ${batchResults.filter((r) => r !== null).length} posts successfully`,
    )
  }

  return results
}

export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log("[v0] Starting Reddit OAuth lead generation...")
        sendProgress(controller, "Starting fetch process...", 0)

        const body = await request.json()
        const timeRange = body.timeRange || 24 // hours
        const postCount = body.postCount || 25
        const effectivePostCount = postCount === -1 ? 500 : postCount
        const customPrompt =
          body.customPrompt ||
          `You are an expert at identifying Reddit posts where people are asking for financial advice and would benefit from professional financial advisory services. Focus on posts where someone is:
- Seeking guidance on complex financial decisions (retirement planning, investments, tax strategy)
- Facing major life financial transitions (inheritance, divorce, career change)
- Confused about financial products or strategies
- Looking for personalized financial planning
- Dealing with significant assets or income that requires professional management`

        const clientId = process.env.REDDIT_CLIENT_ID
        const clientSecret = process.env.REDDIT_CLIENT_SECRET
        const openaiKey = process.env.OPENAI_API_KEY

        if (!clientId || !clientSecret) {
          controller.enqueue(
            `data: ${JSON.stringify({ error: "Missing Reddit credentials. Please add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in the Vars section." })}\n\n`,
          )
          controller.close()
          return
        }

        if (!openaiKey) {
          controller.enqueue(
            `data: ${JSON.stringify({ error: "Missing OpenAI API key. Please add OPENAI_API_KEY in the Vars section." })}\n\n`,
          )
          controller.close()
          return
        }

        const supabase = createServiceRoleClient()

        console.log("[v0] Getting Reddit OAuth token...")
        sendProgress(controller, "Authenticating with Reddit...", 5)

        // Get OAuth access token
        const tokenResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "RedditLeadGen/1.0 by AscotLloyd",
          },
          body: "grant_type=client_credentials",
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error("[v0] Token request failed:", tokenResponse.status, errorText)
          controller.enqueue(
            `data: ${JSON.stringify({ error: `Failed to authenticate with Reddit (${tokenResponse.status}). Please verify your REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are correct.` })}\n\n`,
          )
          controller.close()
          return
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        console.log("[v0] Successfully got OAuth token")
        sendProgress(controller, "Fetching posts from Reddit...", 10)

        const cutoffTime = Date.now() / 1000 - timeRange * 60 * 60

        // Fetch posts from multiple subreddits
        const subreddits = ["personalfinance", "financialindependence", "UKPersonalFinance", "investing"]
        const allPosts: any[] = []

        const postsPerSubreddit = Math.ceil(effectivePostCount / subreddits.length)

        for (const subreddit of subreddits) {
          console.log(`[v0] Fetching posts from r/${subreddit}...`)
          sendProgress(controller, `Fetching from r/${subreddit}...`, 10 + subreddits.indexOf(subreddit) * 5)

          const postsResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=${postsPerSubreddit}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "RedditLeadGen/1.0 by AscotLloyd",
            },
          })

          if (postsResponse.ok) {
            const postsData = await postsResponse.json()
            const posts = postsData.data.children
              .map((child: any) => child.data)
              .filter((post: any) => post.created_utc >= cutoffTime)
            allPosts.push(...posts)
            console.log(`[v0] Fetched ${posts.length} posts from r/${subreddit} within time range`)
          } else {
            console.error(`[v0] Failed to fetch from r/${subreddit}:`, postsResponse.status)
          }

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        console.log(`[v0] Total posts fetched: ${allPosts.length}`)
        sendProgress(controller, `Found ${allPosts.length} posts, checking for duplicates...`, 30)

        const postsToProcess = allPosts.slice(0, effectivePostCount)

        const redditIds = postsToProcess.map((post) => post.id)
        const { data: existingPosts } = await supabase
          .from("reddit_leads")
          .select("reddit_id")
          .in("reddit_id", redditIds)

        const existingRedditIds = new Set(existingPosts?.map((p) => p.reddit_id) || [])
        const newPosts = postsToProcess.filter((post) => !existingRedditIds.has(post.id))

        console.log(`[v0] Found ${existingRedditIds.size} existing posts, ${newPosts.length} new posts to process`)
        sendProgress(controller, `Processing ${newPosts.length} new posts with AI...`, 35)

        const processedPosts = await processBatch(newPosts, customPrompt, openaiKey, supabase, controller, 5)

        console.log(`[v0] Successfully processed ${processedPosts.length} new posts`)
        sendProgress(controller, "Finalizing results...", 95)

        const { data: allLeads, error: fetchError } = await supabase
          .from("reddit_leads")
          .select("*")
          .in("reddit_id", redditIds)
          .order("score", { ascending: false })

        if (fetchError) {
          console.error("[v0] Error fetching leads from database:", fetchError)
          controller.enqueue(`data: ${JSON.stringify({ posts: processedPosts })}\n\n`)
          controller.close()
          return
        }

        const formattedLeads = allLeads.map((lead) => ({
          id: lead.reddit_id,
          title: lead.title,
          content: lead.content || "",
          subreddit: lead.subreddit,
          author: lead.author,
          url: lead.url,
          summary: lead.summary,
          score: lead.score,
          opportunity: lead.opportunity,
          draftReply: lead.draft_reply,
          timestamp: lead.reddit_created_at,
        }))

        console.log(
          `[v0] Returning ${formattedLeads.length} total leads (${processedPosts.length} new, ${formattedLeads.length - processedPosts.length} from database)`,
        )

        sendProgress(controller, "Complete!", 100)
        controller.enqueue(
          `data: ${JSON.stringify({
            complete: true,
            totalPosts: formattedLeads.length,
            newPosts: processedPosts.length,
            existingPosts: formattedLeads.length - processedPosts.length,
          })}\n\n`,
        )
        controller.close()
      } catch (error) {
        console.error("[v0] Error in reddit-oauth API:", error)
        controller.enqueue(
          `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch Reddit posts" })}\n\n`,
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
