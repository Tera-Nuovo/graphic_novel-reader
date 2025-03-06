"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Upload } from "lucide-react"
import { getStoryById, updateStory } from "@/lib/db"
import { useAuth } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { Story } from "@/lib/types"
import { ImageUpload } from "@/components/image-upload"
import { CreateBucketsButton } from '@/components/create-buckets-button'
import { useEnsureBuckets } from '@/lib/hooks/use-ensure-buckets'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function EditStoryPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string
  const { user, isAdmin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [storyData, setStoryData] = useState<Partial<Story>>({
    japanese_title: "",
    english_title: "",
    description: "",
    difficulty_level: "",
    tags: [] as string[],
    cover_image: null,
    status: 'draft'
  })
  const { ensureBuckets, bucketStatus, isEnsuring } = useEnsureBuckets()

  useEffect(() => {
    async function fetchStory() {
      if (!storyId || !user) return
      
      try {
        setIsFetching(true)
        const story = await getStoryById(storyId)
        
        setStoryData({
          ...story,
          tags: story.tags || [],
        })
      } catch (error) {
        console.error("Error fetching story:", error)
        toast({
          title: "Error",
          description: "Failed to load story data",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchStory()
  }, [storyId, user])

  const handleInputChange = (field: string, value: any) => {
    setStoryData({
      ...storyData,
      [field]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isAdmin) {
      toast({
        title: "Authentication required",
        description: "You must be logged in as an admin to update a story",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!storyData.japanese_title || !storyData.english_title || !storyData.description || !storyData.difficulty_level) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      // Process tags from array to string for form display
      const tagsString = Array.isArray(storyData.tags) 
        ? storyData.tags.join(', ')
        : storyData.tags || ''
      
      // Update the story in Supabase
      await updateStory(storyId, {
        japanese_title: storyData.japanese_title,
        english_title: storyData.english_title,
        description: storyData.description as string,
        difficulty_level: storyData.difficulty_level as string,
        tags: Array.isArray(storyData.tags) ? storyData.tags : tagsString.split(',').map(tag => tag.trim()).filter(Boolean),
        cover_image: storyData.cover_image,
        status: storyData.status as 'draft' | 'published'
      })
      
      toast({
        title: "Story updated",
        description: "Your story has been updated successfully",
      })
      
      router.push("/admin")
    } catch (error) {
      console.error("Error updating story:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update story. Please try again.",
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
              <Link href="/admin" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Loading Story...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Edit Story</h1>
          <p className="text-muted-foreground">Make changes to {storyData?.english_title || storyData?.japanese_title || 'this story'}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/admin">Back to Admin</Link>
          </Button>
        </div>
      </div>
      
      {bucketStatus.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage Error</AlertTitle>
          <AlertDescription>
            There was a problem setting up storage for image uploads. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1" 
              onClick={() => ensureBuckets()}
              disabled={isEnsuring}
            >
              {isEnsuring ? "Trying again..." : "Try again"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col space-y-6">
        <form onSubmit={handleSubmit}>
          {/* Story Details */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-jp">Japanese Title</Label>
                    <Input 
                      id="title-jp" 
                      placeholder="Enter Japanese title" 
                      value={storyData.japanese_title || ''}
                      onChange={(e) => handleInputChange("japanese_title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title-en">English Title</Label>
                    <Input 
                      id="title-en" 
                      placeholder="Enter English title" 
                      value={storyData.english_title || ''}
                      onChange={(e) => handleInputChange("english_title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Enter story description" 
                      rows={4} 
                      value={storyData.description || ''}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select 
                      value={storyData.difficulty_level || ''}
                      onValueChange={(value) => handleInputChange("difficulty_level", value)}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input 
                      id="tags" 
                      placeholder="comedy, slice of life, etc." 
                      value={Array.isArray(storyData.tags) ? storyData.tags.join(', ') : ''}
                      onChange={(e) => handleInputChange("tags", e.target.value.split(',').map(tag => tag.trim()))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={storyData.status || 'draft'}
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
                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image</Label>
                    <ImageUpload 
                      initialImage={storyData.cover_image}
                      bucketName="stories"
                      folderPath="covers"
                      onImageUploaded={(url) => handleInputChange("cover_image", url)}
                      aspectRatio="3/4"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.push("/admin")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Story"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 