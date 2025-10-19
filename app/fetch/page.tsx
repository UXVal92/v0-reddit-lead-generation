"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2, X, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check } from "lucide-react"

const DEFAULT_PROMPT = `You are an expert at identifying Reddit posts where people are asking for financial advice and would benefit from professional financial advisory services. Focus on posts where someone is:

- Seeking guidance on complex financial decisions (retirement planning, investments, tax strategy)
- Facing major life financial transitions (inheritance, divorce, career change)
- Confused about financial products or strategies
- Looking for personalized financial planning
- Dealing with significant assets or income that requires professional management

The AI will analyze each post and provide:
1. A summary of their financial situation
2. A lead score (1-10) based on complexity and need
3. A brief analysis of the opportunity for advisory services
4. A professional reply draft positioning you as a financial adviser`

type AISuggestion = {
  analysis: string
  suggestedChanges: string
  improvedPrompt: string
}

export default function FetchPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [fetchPostCount, setFetchPostCount] = useState<string>("25")
  const [fetchAll, setFetchAll] = useState<boolean>(false)
  const [customPrompt, setCustomPrompt] = useState<string>(DEFAULT_PROMPT)
  const [savedPrompt, setSavedPrompt] = useState<string>(DEFAULT_PROMPT)
  const [promptFeedback, setPromptFeedback] = useState<string>("")
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [analyzingFeedback, setAnalyzingFeedback] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<string>("custom")
  const [progressMessage, setProgressMessage] = useState<string>("")
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [progressHistory, setProgressHistory] = useState<string[]>([])
  const [fetchComplete, setFetchComplete] = useState(false)
  const [postCounts, setPostCounts] = useState<{ total: number; new: number; existing: number }>({
    total: 0,
    new: 0,
    existing: 0,
  })

  const { toast } = useToast()
  const router = useRouter()

  const hasUnsavedChanges = customPrompt !== savedPrompt

  useEffect(() => {
    const fetchPromptAndFeedback = async () => {
      try {
        const promptResponse = await fetch("/api/settings?key=ai_prompt")
        if (promptResponse.ok) {
          const promptData = await promptResponse.json()
          if (promptData.value) {
            setCustomPrompt(promptData.value)
            setSavedPrompt(promptData.value)
          }
        }

        const feedbackResponse = await fetch("/api/settings?key=ai_prompt_feedback")
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json()
          if (feedbackData.value) {
            setPromptFeedback(feedbackData.value)
          }
        }

        const searchParamsResponse = await fetch("/api/settings?key=search_parameters")
        if (searchParamsResponse.ok) {
          const searchParamsData = await searchParamsResponse.json()
          if (searchParamsData.value) {
            const params = JSON.parse(searchParamsData.value)

            // Restore date range
            if (params.dateRange) {
              setDateRange({
                from: params.dateRange.from ? new Date(params.dateRange.from) : undefined,
                to: params.dateRange.to ? new Date(params.dateRange.to) : undefined,
              })
            }

            // Restore post count
            if (params.fetchPostCount) {
              setFetchPostCount(params.fetchPostCount)
            }

            if (params.fetchAll !== undefined) {
              setFetchAll(params.fetchAll)
            }

            // Restore time range preset
            if (params.timeRange) {
              setTimeRange(params.timeRange)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error loading settings from database:", error)
      }
    }

    fetchPromptAndFeedback()
  }, [])

  const handleSavePrompt = async () => {
    try {
      const promptResponse = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "ai_prompt",
          value: customPrompt,
        }),
      })

      if (!promptResponse.ok) {
        throw new Error("Failed to save prompt")
      }

      const feedbackResponse = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "ai_prompt_feedback",
          value: promptFeedback,
        }),
      })

      if (!feedbackResponse.ok) {
        throw new Error("Failed to save feedback")
      }

      setSavedPrompt(customPrompt)

      toast({
        title: "Saved successfully",
        description: "Your AI analysis prompt and feedback have been saved to the database.",
      })
    } catch (error) {
      console.error("[v0] Error saving prompt and feedback:", error)
      toast({
        title: "Failed to save",
        description: "There was an error saving your changes to the database. Please try again.",
        variant: "destructive",
      })
      setError("Failed to save to database")
    }
  }

  const handleAnalyzeFeedback = async () => {
    if (!promptFeedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please add some feedback before submitting for AI analysis.",
        variant: "destructive",
      })
      return
    }

    setAnalyzingFeedback(true)
    try {
      const response = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPrompt: customPrompt,
          feedback: promptFeedback,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze feedback")
      }

      const data = await response.json()
      setAiSuggestion(data.suggestion)
      toast({
        title: "Analysis complete",
        description: "AI has analyzed your feedback and suggested improvements.",
      })
    } catch (error) {
      console.error("[v0] Error analyzing feedback:", error)
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAnalyzingFeedback(false)
    }
  }

  const handleApplySuggestion = async () => {
    console.log("[v0] Apply suggestion clicked", { aiSuggestion })
    console.log("[v0] Current customPrompt before update:", customPrompt)

    if (aiSuggestion?.improvedPrompt) {
      console.log("[v0] Applying improved prompt:", aiSuggestion.improvedPrompt)

      setCustomPrompt(aiSuggestion.improvedPrompt)

      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log("[v0] State updated, now saving to database")

      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "ai_prompt",
            value: aiSuggestion.improvedPrompt,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save prompt to database")
        }

        console.log("[v0] Prompt saved to database successfully")

        setSavedPrompt(aiSuggestion.improvedPrompt)

        toast({
          title: "Prompt updated and saved",
          description: "The AI-suggested prompt has been applied and saved to the database.",
        })

        setAiSuggestion(null)
      } catch (error) {
        console.error("[v0] Error saving prompt to database:", error)
        toast({
          title: "Prompt updated but not saved",
          description: "The prompt was applied but failed to save to the database. Please click 'Save Configuration'.",
          variant: "destructive",
        })
      }
    } else {
      console.log("[v0] No improved prompt found in suggestion")
      toast({
        title: "No prompt available",
        description: "Could not find the improved prompt in the AI suggestions.",
        variant: "destructive",
      })
    }
  }

  const handlePresetSelect = (preset: string) => {
    setTimeRange(preset)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case "today":
        setDateRange({ from: today, to: now })
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        setDateRange({ from: yesterday, to: yesterdayEnd })
        break
      case "last-week":
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        setDateRange({ from: lastWeek, to: now })
        break
      case "last-2-weeks":
        const last2Weeks = new Date(today)
        last2Weeks.setDate(last2Weeks.getDate() - 14)
        setDateRange({ from: last2Weeks, to: now })
        break
      case "last-month":
        const lastMonth = new Date(today)
        lastMonth.setDate(lastMonth.getDate() - 30)
        setDateRange({ from: lastMonth, to: now })
        break
      case "custom":
        setDateRange({ from: undefined, to: undefined })
        break
    }
  }

  const fetchRedditPosts = async () => {
    setLoading(true)
    setError(null)
    setFetchComplete(false)
    setPostCounts({ total: 0, new: 0, existing: 0 })

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "search_parameters",
          value: JSON.stringify({
            dateRange: {
              from: dateRange.from?.toISOString(),
              to: dateRange.to?.toISOString(),
            },
            fetchPostCount,
            fetchAll,
            timeRange,
          }),
        }),
      })

      let timeRangeInHours = 24
      if (dateRange.from && dateRange.to) {
        const diffMs = dateRange.to.getTime() - dateRange.from.getTime()
        timeRangeInHours = Math.ceil(diffMs / (1000 * 60 * 60))
      } else if (dateRange.from) {
        const diffMs = Date.now() - dateRange.from.getTime()
        timeRangeInHours = Math.ceil(diffMs / (1000 * 60 * 60))
      }

      const response = await fetch("/api/reddit-oauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeRange: timeRangeInHours,
          postCount: fetchAll ? -1 : Number.parseInt(fetchPostCount),
          customPrompt: customPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        if (value) {
          // Handle both string and Uint8Array types
          if (typeof value === "string") {
            buffer += value
          } else if (value instanceof Uint8Array) {
            buffer += decoder.decode(value, { stream: true })
          }
        }
      }

      const lines = buffer.split("\n\n")
      let completionData = null

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6).trim())
            if (data.complete) {
              completionData = data
              break
            }
            if (data.error) {
              throw new Error(data.error)
            }
          } catch (parseError) {
            // Skip invalid JSON
          }
        }
      }

      if (completionData) {
        setPostCounts({
          total: completionData.totalPosts || 0,
          new: completionData.newPosts || 0,
          existing: completionData.existingPosts || 0,
        })
        setFetchComplete(true)

        toast({
          title: "Fetch complete",
          description: `Found ${completionData.totalPosts} posts (${completionData.newPosts} new, ${completionData.existingPosts} existing)`,
        })
      } else {
        throw new Error("No completion data received")
      }
    } catch (err) {
      console.error("[v0] Fetch error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Fetch failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRunAnotherSearch = () => {
    setFetchComplete(false)
    setProgressHistory([])
    setPostCounts({ total: 0, new: 0, existing: 0 })
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Posts
          </Button>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">Fetch Reddit Posts</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Configure your search parameters and AI analysis settings to find the best posts.
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                <strong>Error:</strong> {error}
              </p>
            </CardContent>
          </Card>
        )}

        <Dialog
          open={loading || fetchComplete}
          onOpenChange={(open) => {
            if (!open && fetchComplete) {
              setFetchComplete(false)
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {fetchComplete ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    Fetch Complete
                  </>
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Fetching Posts
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {fetchComplete ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                    <Check className="h-5 w-5" />
                    <span>Success</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total posts found:</span>
                      <span className="font-semibold text-lg">{postCounts.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">New posts analyzed:</span>
                      <span className="font-semibold text-green-600">{postCounts.new}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Already in database:</span>
                      <span className="font-semibold text-blue-600">{postCounts.existing}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleRunAnotherSearch}>
                    Run Another Search
                  </Button>
                  <Button
                    onClick={() => {
                      setFetchComplete(false)
                      router.push("/")
                    }}
                  >
                    View Results
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Processing your request. This may take a few minutes...
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Parameters</CardTitle>
              <CardDescription>Define the time range and number of posts to fetch from Reddit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Select value={timeRange} onValueChange={handlePresetSelect}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Quick select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                      <SelectItem value="last-2-weeks">Last 2 Weeks</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => {
                          setDateRange({ from: range?.from, to: range?.to })
                          setTimeRange("custom")
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select a preset or pick a custom date range. Defaults to past 24 hours if not set.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postCount">Number of Posts</Label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="fetchAll"
                    checked={fetchAll}
                    onChange={(e) => setFetchAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="fetchAll" className="text-sm font-normal cursor-pointer">
                    Fetch all matching posts (up to 500)
                  </Label>
                </div>
                <Input
                  id="postCount"
                  type="number"
                  min="1"
                  max="500"
                  value={fetchPostCount}
                  onChange={(e) => setFetchPostCount(e.target.value)}
                  placeholder="Enter number of posts (1-500)"
                  disabled={fetchAll}
                />
                <p className="text-xs text-muted-foreground">
                  {fetchAll
                    ? "Will fetch all matching posts from the selected time range (maximum 500 posts). Note: This may consume more API credits."
                    : "Enter the number of posts to fetch (between 1 and 500)."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prompt Configuration</CardTitle>
                  <CardDescription>Customize how the AI analyzes and scores Reddit posts.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSavePrompt}
                  disabled={!hasUnsavedChanges}
                >
                  Save Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiPrompt">AI Analysis Prompt</Label>
                <Textarea
                  id="aiPrompt"
                  rows={12}
                  className="resize-none text-sm font-mono"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom AI analysis prompt..."
                />
                <p className="text-xs text-muted-foreground">
                  Customize how the AI analyzes Reddit posts. Changes are saved to the database when you click "Save
                  Configuration".
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prompt Feedback & Refinement</CardTitle>
                  <CardDescription>Track observations and get AI suggestions to improve your prompt.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAnalyzeFeedback}
                  disabled={analyzingFeedback || !promptFeedback.trim()}
                >
                  {analyzingFeedback ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promptFeedback">Your Observations</Label>
                <Textarea
                  id="promptFeedback"
                  rows={8}
                  className="resize-none text-sm border-white bg-white"
                  value={promptFeedback}
                  onChange={(e) => setPromptFeedback(e.target.value)}
                  placeholder="Add feedback on AI performance here...&#10;&#10;Examples:&#10;- The AI is scoring posts too high/low&#10;- Need more focus on [specific criteria]&#10;- Draft replies are too formal/casual&#10;- Missing important financial indicators&#10;&#10;Use this feedback to refine the prompt above."
                />
                <p className="text-xs text-muted-foreground">
                  Track observations about the AI's performance. Click "Submit Feedback" to receive recommendations for
                  improving your prompt.
                </p>
              </div>

              {aiSuggestion && (
                <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-emerald-700">AI Suggestions</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="default" size="sm" onClick={handleApplySuggestion}>
                        Apply to Prompt
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAiSuggestion(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-emerald-700">Analysis:</p>
                      <div className="rounded bg-background p-3 text-sm leading-relaxed">{aiSuggestion.analysis}</div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-emerald-700">Suggested Changes:</p>
                      <div className="rounded bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {aiSuggestion.suggestedChanges}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-emerald-700">Improved Prompt:</p>
                      <div className="max-h-[200px] overflow-y-auto rounded bg-background p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                        {aiSuggestion.improvedPrompt}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Review the AI's suggestions and click "Apply to Prompt" to use the improved version, or manually
                    edit the prompt above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => router.push("/")} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={fetchRedditPosts} disabled={loading} size="lg" className="gap-2 px-8">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing Reddit Posts...
                </>
              ) : (
                "Fetch Posts"
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
