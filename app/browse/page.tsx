"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublishedStories } from "@/lib/db"
import { Story } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export default function BrowsePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function loadStories() {
      try {
        setIsLoading(true);
        const data = await getPublishedStories();
        setStories(data);
      } catch (error) {
        console.error("Error loading stories:", error);
        toast({
          title: "Error",
          description: "Failed to load stories. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadStories();
  }, []);

  // Filter stories based on search term and difficulty
  const filteredStories = stories.filter(story => {
    // Search term filter
    const matchesSearch = searchTerm === "" || 
      story.japanese_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.english_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.tags && story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Difficulty filter
    const matchesDifficulty = difficulty === "all" || 
      story.difficulty_level.toLowerCase() === difficulty.toLowerCase();
    
    return matchesSearch && matchesDifficulty;
  });

  // Sort stories
  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "title-asc":
        return a.english_title.localeCompare(b.english_title);
      case "title-desc":
        return b.english_title.localeCompare(a.english_title);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Browse Manga</h1>
          <p className="text-muted-foreground">
            Explore our collection of Japanese manga with interactive learning features
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="grid gap-4 md:grid-cols-[1fr_200px_200px]">
          <div className="flex w-full items-center space-x-2">
            <Input 
              type="search" 
              placeholder="Search titles, authors, or tags..." 
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit">Search</Button>
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Loading stories..." : `Showing ${sortedStories.length} results`}
            </div>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </div>

          {/* Grid View */}
          <TabsContent value="grid" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p>Loading stories...</p>
              </div>
            ) : sortedStories.length === 0 ? (
              <div className="text-center py-12">
                <p>No stories found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedStories.map((story) => (
                  <Card key={story.id} className="overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={story.cover_image || "/placeholder.svg?height=400&width=300"}
                        alt={story.english_title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{story.japanese_title}</CardTitle>
                          <CardDescription>{story.english_title}</CardDescription>
                        </div>
                        <Badge>{story.difficulty_level}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{story.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {story.tags && story.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/reader/${story.id}`}>Start Reading</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p>Loading stories...</p>
              </div>
            ) : sortedStories.length === 0 ? (
              <div className="text-center py-12">
                <p>No stories found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {sortedStories.map((story) => (
                  <Card key={story.id}>
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-[150px] h-[200px]">
                        <Image
                          src={story.cover_image || "/placeholder.svg?height=400&width=300"}
                          alt={story.english_title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold">{story.japanese_title}</h3>
                            <p className="text-sm text-muted-foreground">{story.english_title}</p>
                          </div>
                          <Badge>{story.difficulty_level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{story.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {story.tags && story.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-auto pt-4">
                          <Button asChild size="sm">
                            <Link href={`/reader/${story.id}`}>Start Reading</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

