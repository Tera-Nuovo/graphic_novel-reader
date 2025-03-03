"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react"

interface Chapter {
  id: number
  title: string
  order: number
  panelCount: number
  status: "draft" | "published"
}

export default function StoryChaptersPage() {
  const params = useParams()
  const storyId = params.id

  // Sample story data
  const story = {
    id: storyId,
    title: "春の物語",
    englishTitle: "Spring Story",
  }

  // Sample chapters data
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: 1, title: "Chapter 1: The Beginning", order: 1, panelCount: 8, status: "published" },
    { id: 2, title: "Chapter 2: The Journey", order: 2, panelCount: 12, status: "published" },
    { id: 3, title: "Chapter 3: The Challenge", order: 3, panelCount: 10, status: "draft" },
  ])

  const handleDeleteChapter = (chapterId: number) => {
    setChapters(chapters.filter(chapter => chapter.id !== chapterId))
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/admin" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{story.title}</h1>
            <p className="text-muted-foreground">{story.englishTitle}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Chapters</h2>
          <Button asChild>
            <Link href={`/admin/stories/${storyId}/chapters/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Link>
          </Button>
        </div>

        {chapters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">No chapters yet</p>
              <Button asChild>
                <Link href={`/admin/stories/${storyId}/chapters/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Chapter
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{chapter.title}</CardTitle>
                      <CardDescription>
                        {chapter.panelCount} panels • Order: {chapter.order}
                      </CardDescription>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        chapter.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/stories/${storyId}/chapters/${chapter.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Chapter
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/stories/${storyId}/chapters/${chapter.id}/panels`}>
                        Manage Panels
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteChapter(chapter.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 