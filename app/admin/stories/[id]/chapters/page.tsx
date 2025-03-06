"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react"
import { getStoryById, getChaptersByStoryId, deleteChapter } from "@/lib/db"
import { useAuth } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { Story, Chapter } from "@/lib/types"

export default function StoryChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const storyId = params.id as string
  const { user, isAdmin } = useAuth()
  const [isFetching, setIsFetching] = useState(true)
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!storyId || !user) return
      
      try {
        setIsFetching(true)
        
        // Fetch story data
        const storyData = await getStoryById(storyId)
        setStory(storyData)
        
        // Fetch chapters data
        const chaptersData = await getChaptersByStoryId(storyId)
        setChapters(chaptersData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load story and chapters",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [storyId, user])

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
      return
    }
    
    try {
      await deleteChapter(chapterId)
      setChapters(chapters.filter(chapter => chapter.id !== chapterId))
      toast({
        title: "Chapter deleted",
        description: "Chapter has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting chapter:", error)
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive",
      })
    }
  }

  if (isFetching) {
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
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!story) {
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
            <h1 className="text-3xl font-bold">Story not found</h1>
          </div>
          <p>The story you are looking for does not exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/admin">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
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
            <h1 className="text-3xl font-bold">{story.japanese_title}</h1>
            <p className="text-muted-foreground">{story.english_title}</p>
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
                        Order: {chapter.order} • Created: {new Date(chapter.created_at).toLocaleDateString()}
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
                      <Link href={`/admin/stories/${storyId}/chapters/${chapter.id}`}>
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