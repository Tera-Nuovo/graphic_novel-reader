"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Upload } from "lucide-react"
import { createStory } from "@/lib/db"
import { useAuth } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { ensureStorageBuckets } from "@/lib/storage-utils"

export default function CreateStoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [storyData, setStoryData] = useState({
    japanese_title: "",
    english_title: "",
    description: "",
    difficulty_level: "",
    tags: "",
    cover_image: null,
  })

  useEffect(() => {
    // Ensure buckets exist when component mounts
    ensureStorageBuckets().catch(error => {
      console.error("Error ensuring storage buckets:", error);
      toast({
        title: "Storage Error",
        description: "There was an error setting up storage. Image uploads may not work.",
        variant: "destructive",
      });
    });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setStoryData({
      ...storyData,
      [field]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a story",
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
      
      // Process tags from comma-separated string to array
      const tagsArray = storyData.tags 
        ? storyData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : []
      
      // Create the story in Supabase
      const story = await createStory({
        japanese_title: storyData.japanese_title,
        english_title: storyData.english_title,
        description: storyData.description,
        difficulty_level: storyData.difficulty_level,
        tags: tagsArray,
        cover_image: storyData.cover_image,
        status: 'draft'
      })
      
      if (!story) {
        throw new Error('Failed to create story')
      }
      
      toast({
        title: "Story created",
        description: "Your story has been created successfully",
      })
      
      router.push("/admin")
    } catch (error) {
      console.error("Error creating story:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Create New Story</h1>
        </div>

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
                      value={storyData.japanese_title}
                      onChange={(e) => handleInputChange("japanese_title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title-en">English Title</Label>
                    <Input 
                      id="title-en" 
                      placeholder="Enter English title" 
                      value={storyData.english_title}
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
                      value={storyData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select 
                      value={storyData.difficulty_level}
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
                      value={storyData.tags}
                      onChange={(e) => handleInputChange("tags", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image</Label>
                    <ImageUpload 
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
              {isLoading ? "Creating..." : "Create Story"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

