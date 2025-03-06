"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft } from "lucide-react"
import { getStoryById, createChapter, getChaptersByStoryId } from "@/lib/db"
import { useAuth } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { Story } from "@/lib/types"

export default function CreateChapterPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string
  const { user, isAdmin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [story, setStory] = useState<Story | null>(null)
  const [nextOrder, setNextOrder] = useState(1)
  const [chapterData, setChapterData] = useState({
    title: "",
    order: 1,
    status: "draft",
  })

  useEffect(() => {
    async function fetchData() {
      if (!storyId || !user) return
      
      try {
        setIsFetching(true)
        
        // Fetch story data
        const storyData = await getStoryById(storyId)
        setStory(storyData)
        
        // Fetch chapters to determine next order
        const chapters = await getChaptersByStoryId(storyId)
        if (chapters.length > 0) {
          const highestOrder = Math.max(...chapters.map(ch => ch.order))
          setNextOrder(highestOrder + 1)
          setChapterData(prev => ({ ...prev, order: highestOrder + 1 }))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load story data",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [storyId, user])

  const handleInputChange = (field: string, value: any) => {
    setChapterData({
      ...chapterData,
      [field]: field === 'order' ? parseInt(value) : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isAdmin) {
      toast({
        title: "Authentication required",
        description: "You must be logged in as an admin to create a chapter",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!chapterData.title || !chapterData.order) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create the chapter in Supabase
      await createChapter({
        story_id: storyId,
        title: chapterData.title,
        order: chapterData.order,
        status: chapterData.status as 'draft' | 'published'
      })
      
      toast({
        title: "Chapter created",
        description: "Your chapter has been created successfully",
      })
      
      router.push(`/admin/stories/${storyId}/chapters`)
    } catch (error) {
      console.error("Error creating chapter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create chapter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="container py-10">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href={`/admin/stories/${storyId}/chapters`} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Chapters
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
              <Link href={`/admin/stories/${storyId}/chapters`} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Chapters
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
            <Link href={`/admin/stories/${storyId}/chapters`} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Chapters
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Chapter</h1>
            <p className="text-muted-foreground">Story: {story.japanese_title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Chapter Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter chapter title" 
                    value={chapterData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-6 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input 
                      id="order" 
                      type="number"
                      min="1"
                      placeholder="Enter chapter order" 
                      value={chapterData.order}
                      onChange={(e) => handleInputChange("order", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={chapterData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.push(`/admin/stories/${storyId}/chapters`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Chapter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 