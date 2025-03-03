"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Book, BookOpen, Settings, Users } from "lucide-react"

export default function AdminDashboard() {
  // Sample data for the dashboard
  const stats = [
    { title: "Total Stories", value: "12", icon: Book },
    { title: "Total Chapters", value: "48", icon: BookOpen },
    { title: "Active Users", value: "256", icon: Users },
  ]

  // Sample stories data
  const stories = [
    { id: 1, title: "春の物語", englishTitle: "Spring Story", chapters: 4, status: "Published" },
    { id: 2, title: "夏の冒険", englishTitle: "Summer Adventure", chapters: 3, status: "Draft" },
    { id: 3, title: "秋の旅", englishTitle: "Autumn Journey", chapters: 2, status: "Published" },
  ]

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New Story
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/create">
            <Plus className="h-5 w-5" />
            <span>New Story</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/chapters/create">
            <BookOpen className="h-5 w-5" />
            <span>New Chapter</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/users">
            <Users className="h-5 w-5" />
            <span>Manage Users</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/settings">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </Button>
      </div>

      {/* Stories List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stories</CardTitle>
          <CardDescription>Manage your created stories and chapters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Title</th>
                  <th className="text-left py-3 px-4 font-medium">English Title</th>
                  <th className="text-left py-3 px-4 font-medium">Chapters</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stories.map((story) => (
                  <tr key={story.id} className="border-b">
                    <td className="py-3 px-4">{story.id}</td>
                    <td className="py-3 px-4">{story.title}</td>
                    <td className="py-3 px-4">{story.englishTitle}</td>
                    <td className="py-3 px-4">{story.chapters}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          story.status === "Published"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {story.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/stories/${story.id}`}>Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/stories/${story.id}/chapters`}>Chapters</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 