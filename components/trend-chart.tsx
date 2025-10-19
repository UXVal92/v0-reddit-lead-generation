"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
  isWithinInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface RedditPost {
  id: string
  date: Date
  [key: string]: any
}

interface TrendChartProps {
  posts: RedditPost[]
}

type TimeFrame = "day" | "week" | "month"

export function TrendChart({ posts }: TrendChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("day")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [timeRangePreset, setTimeRangePreset] = useState<string>("last-week")

  const handlePresetSelect = (preset: string) => {
    console.log("[v0] Preset selected:", preset)
    setTimeRangePreset(preset)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case "today":
        setCustomDateRange({ from: today, to: now })
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        setCustomDateRange({ from: yesterday, to: yesterdayEnd })
        break
      case "last-week":
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        setCustomDateRange({ from: lastWeek, to: now })
        break
      case "last-2-weeks":
        const last2Weeks = new Date(today)
        last2Weeks.setDate(last2Weeks.getDate() - 14)
        setCustomDateRange({ from: last2Weeks, to: now })
        break
      case "last-month":
        const lastMonth = new Date(today)
        lastMonth.setDate(lastMonth.getDate() - 30)
        setCustomDateRange({ from: lastMonth, to: now })
        break
      case "custom":
        setCustomDateRange({ from: undefined, to: undefined })
        break
    }
  }

  const chartData = useMemo(() => {
    console.log("[v0] Calculating chart data with timeFrame:", timeFrame, "customDateRange:", customDateRange)
    if (posts.length === 0) return []

    const now = new Date()
    const dataMap = new Map<string, number>()

    const periods: Date[] = []
    let formatString = ""

    if (customDateRange?.from && customDateRange?.to) {
      const startDate = startOfDay(customDateRange.from)
      const endDate = startOfDay(customDateRange.to)

      switch (timeFrame) {
        case "day":
          formatString = "MMM dd"
          periods.push(...eachDayOfInterval({ start: startDate, end: endDate }))
          break
        case "week":
          formatString = "MMM dd"
          periods.push(...eachWeekOfInterval({ start: startDate, end: endDate }))
          break
        case "month":
          formatString = "MMM yyyy"
          periods.push(...eachMonthOfInterval({ start: startDate, end: endDate }))
          break
      }
    } else {
      // Fallback to default behavior if no custom range
      switch (timeFrame) {
        case "day":
          formatString = "MMM dd"
          for (let i = 6; i >= 0; i--) {
            const date = startOfDay(subDays(now, i))
            periods.push(date)
          }
          break
        case "week":
          formatString = "MMM dd"
          for (let i = 11; i >= 0; i--) {
            const date = startOfWeek(subWeeks(now, i))
            periods.push(date)
          }
          break
        case "month":
          formatString = "MMM yyyy"
          for (let i = 11; i >= 0; i--) {
            const date = startOfMonth(subMonths(now, i))
            periods.push(date)
          }
          break
      }
    }

    // Initialize all periods with 0 count
    periods.forEach((period) => {
      dataMap.set(period.toISOString(), 0)
    })

    const filteredPosts =
      customDateRange?.from && customDateRange?.to
        ? posts.filter((post) => {
            const postDate = startOfDay(post.date)
            return isWithinInterval(postDate, {
              start: startOfDay(customDateRange.from!),
              end: startOfDay(customDateRange.to!),
            })
          })
        : posts

    console.log("[v0] Filtered posts count:", filteredPosts.length)

    filteredPosts.forEach((post) => {
      let periodKey: string

      switch (timeFrame) {
        case "day":
          periodKey = startOfDay(post.date).toISOString()
          break
        case "week":
          periodKey = startOfWeek(post.date).toISOString()
          break
        case "month":
          periodKey = startOfMonth(post.date).toISOString()
          break
        default:
          return
      }

      if (dataMap.has(periodKey)) {
        dataMap.set(periodKey, (dataMap.get(periodKey) || 0) + 1)
      }
    })

    const result = periods.map((period) => ({
      date: format(period, formatString),
      count: dataMap.get(period.toISOString()) || 0,
      fullDate: period,
    }))

    console.log("[v0] Chart data result:", result)
    return result
  }, [posts, timeFrame, customDateRange])

  const totalPosts = posts.length
  const averagePerPeriod = useMemo(() => {
    if (chartData.length === 0) return 0
    const sum = chartData.reduce((acc, item) => acc + item.count, 0)
    return (sum / chartData.length).toFixed(1)
  }, [chartData])

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Post Volume Trends</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalPosts} total posts • Avg {averagePerPeriod} per{" "}
              {timeFrame === "day" ? "day" : timeFrame === "week" ? "week" : "month"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
              <TabsList>
                <TabsTrigger value="day">Daily</TabsTrigger>
                <TabsTrigger value="week">Weekly</TabsTrigger>
                <TabsTrigger value="month">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={timeRangePreset} onValueChange={handlePresetSelect}>
              <SelectTrigger className="w-[160px]">
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
                <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "LLL dd, y")} - {format(customDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDateRange.from, "LLL dd, y")
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
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range)
                    setTimeRangePreset("custom")
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.date}
                            </span>
                            <span className="font-bold text-foreground">
                              {payload[0].value} post{payload[0].value !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#9bc76d"
                strokeWidth={3}
                dot={{ fill: "#9bc76d", strokeWidth: 2, r: 5, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#9bc76d", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No data available for the selected time frame
          </div>
        )}
      </CardContent>
    </Card>
  )
}
