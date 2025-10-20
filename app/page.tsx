"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Filter,
  X,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Trash2,
  LogOut,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { TrendChart } from "@/components/trend-chart"
import { createClient } from "@/lib/supabase/client"

interface RedditPost {
  id: string
  title: string
  content: string
  subreddit: string
  author: string
  url: string
  summary: string
  score: number
  opportunity: string // Added opportunity field to interface
  draftReply: string
  timestamp: string
  date: Date
}

const MOCK_POSTS: RedditPost[] = [
  {
    id: "1",
    title: "Just inherited $500k from my grandmother. What should I do with it?",
    content:
      "User inherited $500k and is unsure how to invest it. They're 32 years old, have no debt, and currently rent. They mention wanting to buy a house but are also interested in long-term wealth building.",
    subreddit: "personalfinance",
    author: "throwaway_inheritance",
    url: "https://reddit.com/r/personalfinance/example1",
    summary:
      "User inherited $500k and is unsure how to invest it. They're 32 years old, have no debt, and currently rent. They mention wanting to buy a house but are also interested in long-term wealth building.",
    score: 9,
    opportunity:
      "Client has a significant inheritance and needs guidance on wealth building and homeownership. Ideal for comprehensive financial planning services.",
    draftReply:
      "Congratulations on your inheritance! This is a great opportunity to build long-term wealth. I'd recommend considering a diversified approach: allocate funds for a house down payment if that's a priority, max out retirement accounts, and invest the remainder in a balanced portfolio. As a financial adviser, I help clients create personalized strategies for situations like this. Would you be open to a brief consultation to discuss your specific goals?",
    timestamp: "2 hours ago",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Confused about 401k vs Roth IRA - which should I prioritize?",
    content:
      "User is 28, earning $85k/year, and confused about whether to max out their 401k or focus on Roth IRA contributions. They have a 4% employer match on their 401k.",
    subreddit: "financialindependence",
    author: "confused_saver",
    url: "https://reddit.com/r/financialindependence/example2",
    summary:
      "User is 28, earning $85k/year, and confused about whether to max out their 401k or focus on Roth IRA contributions. They have a 4% employer match on their 401k.",
    score: 8,
    opportunity:
      "Client is in their prime earning years and seeking clarity on retirement account optimization. Perfect for retirement planning and investment strategy discussions.",
    draftReply:
      "Great question! The general rule is to contribute enough to your 401k to get the full employer match (free money!), then max out your Roth IRA, then go back to maxing your 401k if you have funds left. At your income level, you're in a good position to do both. The tax advantages of each account serve different purposes in retirement planning. I'd be happy to walk you through a personalized strategy if you'd like to chat further.",
    timestamp: "4 hours ago",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Starting a business - how much should I keep in emergency fund?",
    content:
      "User is leaving their corporate job to start a consulting business. They have $40k saved and are wondering how much to keep liquid vs invest while building their business.",
    subreddit: "Entrepreneur",
    author: "new_business_owner",
    url: "https://reddit.com/r/Entrepreneur/example3",
    summary:
      "User is leaving their corporate job to start a consulting business. They have $40k saved and are wondering how much to keep liquid vs invest while building their business.",
    score: 7,
    opportunity:
      "Client is transitioning to entrepreneurship and needs advice on cash flow management and building a safety net. Excellent fit for small business financial planning.",
    draftReply:
      "Exciting move! For entrepreneurs, I typically recommend 12-18 months of expenses in your emergency fund (vs the standard 6 months for W2 employees) due to income variability. Given you're starting a consulting business, you'll want to balance liquidity with growth. Consider keeping your emergency fund in a high-yield savings account while investing excess funds strategically. I work with several entrepreneurs on this exact transition - happy to share some frameworks if helpful.",
    timestamp: "6 hours ago",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "4",
    title: "Parents retiring soon with only $200k saved - how can I help?",
    content:
      "User's parents are 63 and 65, planning to retire in 2 years with only $200k in retirement savings. They own their home outright. User wants to know how to help them maximize their retirement income.",
    subreddit: "personalfinance",
    author: "worried_son",
    url: "https://reddit.com/r/personalfinance/example4",
    summary:
      "User's parents are 63 and 65, planning to retire in 2 years with only $200k in retirement savings. They own their home outright. User wants to know how to help them maximize their retirement income.",
    score: 8,
    opportunity:
      "Client is concerned about their parents' retirement readiness. This is a sensitive situation that requires careful planning around Social Security, withdrawal strategies, and potentially other income sources.",
    draftReply:
      "It's wonderful that you're thinking about your parents' financial security. With $200k saved and a paid-off home, they have some options. Key considerations include Social Security timing (delaying can increase benefits significantly), potential part-time work, and strategic withdrawal strategies. There may also be opportunities with reverse mortgages or downsizing depending on their goals. This situation requires careful planning - I'd be glad to discuss strategies that could help maximize their retirement income if you'd like to connect.",
    timestamp: "8 hours ago",
    date: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: "5",
    title: "Made $150k from crypto - how do I handle taxes and invest wisely?",
    content:
      "User made significant gains from cryptocurrency investments and wants to know about tax implications and how to diversify their windfall into more stable investments.",
    subreddit: "CryptoCurrency",
    author: "crypto_gains",
    url: "https://reddit.com/r/CryptoCurrency/example5",
    summary:
      "User made significant gains from cryptocurrency investments and wants to know about tax implications and how to diversify their windfall into more stable investments.",
    score: 9,
    opportunity:
      "Client has experienced a significant financial windfall from crypto and requires expert advice on tax implications and portfolio diversification. Specialized tax and investment planning services are needed.",
    draftReply:
      "Congrats on your gains! Crypto taxes can be complex - you'll owe capital gains tax on your profits, and the rate depends on your holding period and income bracket. For the investment side, diversification is key after a concentrated win like this. Consider tax-loss harvesting strategies and building a balanced portfolio across asset classes. I specialize in helping clients navigate windfalls and crypto taxation - would you be interested in discussing a comprehensive strategy?",
    timestamp: "10 hours ago",
    date: new Date(Date.now() - 10 * 60 * 60 * 1000),
  },
  {
    id: "6",
    title: "Should I pay off my mortgage early or invest the extra money?",
    content:
      "User has a 3.5% mortgage rate and $2000/month extra to either pay down the mortgage or invest. They're 40 years old with 20 years left on the mortgage.",
    subreddit: "personalfinance",
    author: "homeowner_dilemma",
    url: "https://reddit.com/r/personalfinance/example6",
    summary:
      "User has a 3.5% mortgage rate and $2000/month extra to either pay down the mortgage or invest. They're 40 years old with 20 years left on the mortgage.",
    score: 6,
    opportunity:
      "Client is at a crossroads with their mortgage payments and investment strategy. Needs guidance to balance debt reduction with wealth growth based on their risk tolerance.",
    draftReply:
      "This is a common dilemma! With a 3.5% rate, you could potentially earn more by investing, especially in a diversified portfolio. However, the psychological benefit of being debt-free is valuable too. Consider a hybrid approach: invest most of it while making some extra principal payments. The right answer depends on your risk tolerance and financial goals. I'd be happy to run some scenarios for you if you'd like to explore this further.",
    timestamp: "1 day ago",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "7",
    title: "25 years old, $100k saved - am I on track for early retirement?",
    content:
      "User is 25, earning $120k/year, has $100k saved, and wants to retire by 45. They're currently saving 40% of their income.",
    subreddit: "financialindependence",
    author: "young_saver",
    url: "https://reddit.com/r/financialindependence/example7",
    summary:
      "User is 25, earning $120k/year, has $100k saved, and wants to retire by 45. They're currently saving 40% of their income.",
    score: 5,
    opportunity:
      "Client is young, highly motivated, and focused on early retirement (FIRE). Needs guidance on maximizing savings and investment growth to achieve aggressive retirement goals.",
    draftReply:
      "You're off to an excellent start! At 25 with $100k saved and a 40% savings rate, you're well-positioned for early retirement. The key will be maintaining that savings rate and ensuring your investments are optimized for growth. I'd recommend reviewing your asset allocation and tax strategies to maximize your path to FIRE. Would you be interested in a consultation to map out your 20-year plan?",
    timestamp: "2 days ago",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "8",
    title: "Received a $50k bonus - best way to use it?",
    content:
      "User received an unexpected $50k bonus and wants advice on whether to invest, pay down student loans (5% interest), or save for a house down payment.",
    subreddit: "personalfinance",
    author: "bonus_recipient",
    url: "https://reddit.com/r/personalfinance/example8",
    summary:
      "User received an unexpected $50k bonus and wants advice on whether to invest, pay down student loans (5% interest), or save for a house down payment.",
    score: 7,
    opportunity:
      "Client has a financial windfall and is weighing multiple options (debt paydown, investment, savings). Requires tailored advice to optimize the use of the bonus based on their financial goals and risk tolerance.",
    draftReply:
      "Congratulations on the bonus! With 5% student loan interest, you're in a gray area where both paying down debt and investing could make sense. I'd suggest a balanced approach: pay down a portion of the high-interest debt, invest some for long-term growth, and keep some liquid for your house fund. The exact split depends on your timeline and goals. I help clients optimize windfalls like this regularly - happy to discuss a personalized strategy.",
    timestamp: "3 days ago",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
]

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

export default function RedditLeadGenPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, { content: boolean; summary: boolean; opportunity: boolean; draft: boolean }> // Added opportunity to collapsed sections
  >({})

  const [selectedScores, setSelectedScores] = useState<number[]>([])
  const [filterDateRange, setFilterDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [authorFilter, setAuthorFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [displayLimit, setDisplayLimit] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState("")
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/login")
      } else {
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchExistingPosts = async () => {
      try {
        setInitialLoading(true)
        const response = await fetch("/api/reddit-leads")

        if (response.ok) {
          const data = await response.json()
          const transformedPosts = data.posts.map((post: any) => ({
            ...post,
            date: new Date(post.timestamp),
          }))
          setPosts(transformedPosts)
          console.log(`[v0] Loaded ${transformedPosts.length} existing posts from database`)
        }
      } catch (err) {
        console.error("[v0] Error loading existing posts:", err)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchExistingPosts()
  }, [isAuthenticated])

  const handleDeletePost = async (postId: string) => {
    setDeletingId(postId)
    try {
      const response = await fetch(`/api/reddit-leads/${postId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete lead")
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId))
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      })
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      toast({
        title: "Failed to delete post",
        description: "There was an error deleting the post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  const handleDeleteAll = async () => {
    if (deleteAllConfirmation !== "DELETE") {
      toast({
        title: "Incorrect confirmation",
        description: "Please type DELETE to confirm.",
        variant: "destructive",
      })
      return
    }

    setDeletingAll(true)
    try {
      const response = await fetch("/api/reddit-leads", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete all posts")
      }

      const deletedCount = posts.length
      setPosts([])
      toast({
        title: "All posts deleted",
        description: `Successfully deleted all ${deletedCount} posts from the database.`,
      })
    } catch (error) {
      console.error("[v0] Error deleting all posts:", error)
      toast({
        title: "Failed to delete all posts",
        description: "There was an error deleting all posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingAll(false)
      setDeleteAllDialogOpen(false)
      setDeleteAllConfirmation("")
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      router.push("/auth/login")
    } catch (error) {
      console.error("[v0] Error logging out:", error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoggingOut(false)
    }
  }

  const uniqueAuthors = useMemo(() => {
    return Array.from(new Set(posts.map((post) => post.author))).sort()
  }, [posts])

  const uniqueSources = useMemo(() => {
    return Array.from(new Set(posts.map((post) => post.subreddit))).sort()
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedScores.length > 0 && !selectedScores.includes(post.score)) return false

      if (filterDateRange.from) {
        const start = new Date(filterDateRange.from)
        start.setHours(0, 0, 0, 0)
        if (post.date < start) return false
      }
      if (filterDateRange.to) {
        const end = new Date(filterDateRange.to)
        end.setHours(23, 59, 59, 999)
        if (post.date > end) return false
      }

      if (authorFilter !== "all" && post.author !== authorFilter) return false

      if (sourceFilter !== "all" && post.subreddit !== sourceFilter) return false

      return true
    })
  }, [posts, selectedScores, filterDateRange, authorFilter, sourceFilter])

  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts]

    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => b.date.getTime() - a.date.getTime())
        break
      case "oldest":
        sorted.sort((a, b) => a.date.getTime() - b.date.getTime())
        break
      case "highest-score":
        sorted.sort((a, b) => b.score - a.score)
        break
      case "lowest-score":
        sorted.sort((a, b) => a.score - b.score)
        break
    }

    return sorted
  }, [filteredPosts, sortBy])

  const displayedPosts = useMemo(() => {
    if (displayLimit === "all") return sortedPosts
    const limit = Number.parseInt(displayLimit)
    return sortedPosts.slice(0, limit)
  }, [sortedPosts, displayLimit])

  const resetFilters = () => {
    setSelectedScores([])
    setFilterDateRange({ from: undefined, to: undefined })
    setAuthorFilter("all")
    setSourceFilter("all")
    setDisplayLimit("all")
    setSortBy("newest")
  }

  const toggleScore = (score: number) => {
    setSelectedScores((prev) =>
      prev.includes(score) ? prev.filter((s) => s !== score) : [...prev, score].sort((a, b) => a - b),
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    if (score >= 6) return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    if (score >= 4) return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    return "bg-slate-500/10 text-slate-600 border-slate-500/20"
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleFilterPresetSelect = (preset: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case "today":
        setFilterDateRange({ from: today, to: now })
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        setFilterDateRange({ from: yesterday, to: yesterdayEnd })
        break
      case "last-week":
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        setFilterDateRange({ from: lastWeek, to: now })
        break
      case "last-2-weeks":
        const last2Weeks = new Date(today)
        last2Weeks.setDate(last2Weeks.getDate() - 14)
        setFilterDateRange({ from: last2Weeks, to: now })
        break
      case "last-month":
        const lastMonth = new Date(today)
        lastMonth.setDate(lastMonth.getDate() - 30)
        setFilterDateRange({ from: lastMonth, to: now })
        break
      case "custom":
        setFilterDateRange({ from: undefined, to: undefined })
        break
    }
  }

  const toggleSection = (postId: string, section: "content" | "summary" | "opportunity" | "draft") => {
    // Added opportunity to section types
    setCollapsedSections((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [section]: !prev[postId]?.[section],
      },
    }))
  }

  useEffect(() => {
    const newCollapsedState: Record<
      string,
      { content: boolean; summary: boolean; opportunity: boolean; draft: boolean }
    > = {} // Added opportunity to collapsed state
    posts.forEach((post) => {
      if (!collapsedSections[post.id]) {
        newCollapsedState[post.id] = { content: true, summary: true, opportunity: true, draft: true } // Default opportunity to collapsed
      }
    })
    if (Object.keys(newCollapsedState).length > 0) {
      setCollapsedSections((prev) => ({ ...prev, ...newCollapsedState }))
    }
  }, [posts])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-end">
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Log Out
              </>
            )}
          </Button>
        </div>

        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Reddit Post Finder</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Extract high-quality Reddit posts, get AI-powered summaries and scores, and draft personalized replies to
            find financial advisory posts.
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-3">
          <Button
            onClick={() => router.push("/fetch")}
            disabled={loading}
            size="lg"
            className="gap-2 px-8 text-base font-medium"
          >
            <RefreshCw className="h-5 w-5" />
            Fetch Reddit Posts
          </Button>
          {posts.length > 0 && (
            <Button
              onClick={() => setDeleteAllDialogOpen(true)}
              disabled={deletingAll}
              size="lg"
              variant="destructive"
              className="gap-2 px-8 text-base font-medium"
            >
              {deletingAll ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
                  Delete All Posts
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                <strong>Error:</strong> {error}
              </p>
            </CardContent>
          </Card>
        )}

        {posts.length > 0 && (
          <div className="mb-6">
            <TrendChart posts={posts} />
          </div>
        )}

        {posts.length > 0 && (
          <Card className="mb-6 border-border/50 bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">Filters</CardTitle>
                  {(selectedScores.length > 0 ||
                    filterDateRange.from ||
                    filterDateRange.to ||
                    authorFilter !== "all" ||
                    sourceFilter !== "all") && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {[
                        selectedScores.length > 0 ? 1 : 0,
                        filterDateRange.from || filterDateRange.to ? 1 : 0,
                        authorFilter !== "all" ? 1 : 0,
                        sourceFilter !== "all" ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}{" "}
                      active
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Filters - Left Column */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Date Range
                    </label>
                    <div className="flex gap-2">
                      <Select onValueChange={handleFilterPresetSelect}>
                        <SelectTrigger className="w-[180px] h-9">
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
                              "flex-1 justify-start text-left font-normal h-9",
                              !filterDateRange.from && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterDateRange.from ? (
                              filterDateRange.to ? (
                                <>
                                  {format(filterDateRange.from, "LLL dd, y")} -{" "}
                                  {format(filterDateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(filterDateRange.from, "LLL dd, y")
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
                            defaultMonth={filterDateRange.from}
                            selected={{ from: filterDateRange.from, to: filterDateRange.to }}
                            onSelect={(range) => setFilterDateRange({ from: range?.from, to: range?.to })}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Post Score
                    </label>
                    <Select onValueChange={(value) => toggleScore(Number.parseInt(value))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select scores to filter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Score {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedScores.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {selectedScores.map((score) => (
                          <Badge
                            key={`score-badge-${score}`}
                            variant="secondary"
                            className="gap-1 text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={() => toggleScore(score)}
                          >
                            {score}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Filters - Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Author
                    </label>
                    <Select value={authorFilter} onValueChange={setAuthorFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All authors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Authors</SelectItem>
                        {uniqueAuthors.map((author) => (
                          <SelectItem key={`author-${author}`} value={author}>
                            u/{author}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Subreddit
                    </label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All subreddits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subreddits</SelectItem>
                        {uniqueSources.map((source) => (
                          <SelectItem key={`source-${source}`} value={source}>
                            r/{source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Display Limit - Bottom Row */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-9 w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="highest-score">Highest Score</SelectItem>
                        <SelectItem value="lowest-score">Lowest Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Display Limit
                    </label>
                    <Select value={displayLimit} onValueChange={setDisplayLimit}>
                      <SelectTrigger className="h-9 w-[180px]">
                        <SelectValue placeholder="All records" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="10">10 Records</SelectItem>
                        <SelectItem value="25">25 Records</SelectItem>
                        <SelectItem value="50">50 Records</SelectItem>
                        <SelectItem value="100">100 Records</SelectItem>
                      </SelectContent>
                    </Select>
                    {displayLimit !== "all" && (
                      // Update to use sortedPosts
                      <span className="text-xs text-muted-foreground">
                        Showing {Math.min(Number.parseInt(displayLimit), sortedPosts.length)} of {sortedPosts.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {posts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                {displayedPosts.length === posts.length
                  ? `Found ${posts.length} Posts`
                  : `Showing ${displayedPosts.length} of ${sortedPosts.length} Posts`}
              </h2>
            </div>

            {displayedPosts.length > 0 ? (
              <div className="grid gap-6">
                {displayedPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                    <CardHeader className="space-y-3 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-xl leading-tight text-balance">{post.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="font-normal">
                              r/{post.subreddit}
                            </Badge>
                            <span>•</span>
                            <span>u/{post.author}</span>
                            <span>•</span>
                            <span>{format(post.date, "MMM dd, yyyy")}</span>
                            <span>•</span>
                            <span>{formatTimestamp(post.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`shrink-0 ${getScoreColor(post.score)}`}>Score: {post.score}/10</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPostToDelete(post.id)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={deletingId === post.id}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            {deletingId === post.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <button
                          onClick={() => toggleSection(post.id, "content")}
                          className="flex w-full items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-all duration-200 group"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-foreground">
                            Original Text
                          </span>
                          {collapsedSections[post.id]?.content ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          ) : (
                            <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          )}
                        </button>
                        {!collapsedSections[post.id]?.content && (
                          <p className="mt-3 px-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {post.content || "No content available"}
                          </p>
                        )}
                      </div>

                      <div>
                        <button
                          onClick={() => toggleSection(post.id, "summary")}
                          className="flex w-full items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-all duration-200 group"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-foreground">
                            Summary
                          </span>
                          {collapsedSections[post.id]?.summary ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          ) : (
                            <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          )}
                        </button>
                        {!collapsedSections[post.id]?.summary && (
                          <p className="mt-3 px-4 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
                        )}
                      </div>

                      <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
                        <button
                          onClick={() => toggleSection(post.id, "opportunity")}
                          className="flex w-full items-center justify-between px-4 py-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 group"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-blue-700">
                            Why Reach Out (Ascot Lloyd)
                          </span>
                          {collapsedSections[post.id]?.opportunity ? (
                            <ChevronDown className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                          ) : (
                            <ChevronUp className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                          )}
                        </button>
                        {!collapsedSections[post.id]?.opportunity && (
                          <p className="mt-3 px-4 text-sm leading-relaxed text-foreground">
                            {post.opportunity || "Opportunity analysis not available"}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg bg-muted/50 p-4">
                        <button
                          onClick={() => toggleSection(post.id, "draft")}
                          className="flex w-full items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-all duration-200 group"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-foreground">
                            Suggested Reply
                          </span>
                          {collapsedSections[post.id]?.draft ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          ) : (
                            <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          )}
                        </button>
                        {!collapsedSections[post.id]?.draft && (
                          <p className="mt-3 px-4 text-sm leading-relaxed text-foreground">{post.draftReply}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                            View on Reddit
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">No posts match your filters</h3>
                  <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                    Try adjusting your filter criteria to see more results.
                  </p>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!loading && posts.length === 0 && !error && (
          <Card className="border-dashed">
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12 text-center">
              {initialLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Loading existing posts...</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">Fetching your saved posts from the database.</p>
                </>
              ) : (
                <>
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <RefreshCw className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">No posts yet</h3>
                  <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    Click the button above to fetch and analyze Reddit posts for potential posts.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <div className="text-sm text-muted-foreground space-y-2">
              <div>
                {postToDelete && posts.find((p) => p.id === postToDelete)?.title
                  ? `"${posts.find((p) => p.id === postToDelete)!.title.substring(0, 80)}${posts.find((p) => p.id === postToDelete)!.title.length > 80 ? "..." : ""}"`
                  : "This post"}
              </div>
              <div className="text-destructive font-medium">
                This will permanently remove this post from your database. This action cannot be undone.
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDeletePost(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Delete All Posts?</AlertDialogTitle>
            <div className="text-sm text-muted-foreground space-y-3">
              <div className="font-semibold text-foreground">
                You are about to permanently delete {posts.length} post{posts.length === 1 ? "" : "s"} from your
                database.
              </div>
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="font-medium mb-1">This includes:</div>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>All post data and analysis</li>
                  <li>AI-generated summaries and opportunities</li>
                  <li>Draft replies</li>
                </ul>
              </div>
              <div className="text-destructive font-medium">This action cannot be undone and cannot be recovered.</div>
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation" className="text-foreground">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm:
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteAllConfirmation}
                  onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                  placeholder="Type DELETE here"
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAllConfirmation("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deleteAllConfirmation !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              Delete All Posts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
