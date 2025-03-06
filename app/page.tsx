"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPublishedStories } from "@/lib/db"
import { Story } from "@/lib/types" 

export default function Home() {
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        setIsLoading(true);
        const data = await getPublishedStories();
        // Get only the first 3 published stories to feature
        setFeaturedStories(data.slice(0, 3));
      } catch (error) {
        console.error("Error loading featured stories:", error);
        // Use fallback data if there's an error
        setFeaturedStories([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadStories();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Learn Japanese Through Interactive Manga
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Read authentic Japanese comics with furigana support and interactive translations. Click on any word
                  to see its meaning and build your vocabulary naturally.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/browse">Browse Stories</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[500px] lg:max-w-none">
              <div className="aspect-video overflow-hidden rounded-xl">
                <Image
                  src="/placeholder.svg?height=600&width=800"
                  alt="Manga reader interface preview"
                  width={800}
                  height={600}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Featured Stories</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Explore our collection of Japanese manga with interactive learning features.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {isLoading ? (
              <div className="col-span-3 text-center py-12">
                <p>Loading featured stories...</p>
              </div>
            ) : featuredStories.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p>No stories available yet. Check back soon!</p>
              </div>
            ) : (
              featuredStories.map((story) => (
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
                    <p className="text-sm text-muted-foreground">{story.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/reader/${story.id}`}>Start Reading</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          <div className="flex justify-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/browse">View All Stories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Key Features</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Tools designed to make learning Japanese through manga effective and enjoyable.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Furigana Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Reading aids that show the pronunciation of kanji characters, making it easier for beginners to read.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Interactive Translations</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Click on any word or phrase to see its meaning, pronunciation, and grammatical information.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Keep track of your reading progress and vocabulary acquisition as you read more stories.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Difficulty Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Stories categorized by difficulty level, from absolute beginner to advanced, to match your
                  proficiency.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary Lists</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Save words you want to remember and review them later with built-in spaced repetition.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Offline Reading</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Download stories to read offline, perfect for studying on the go without an internet connection.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Start Learning?</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Join thousands of learners who are improving their Japanese through reading manga.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">Sign Up Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

