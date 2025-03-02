import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  // Sample featured stories
  const featuredStories = [
    {
      id: 1,
      title: "よつばと!",
      englishTitle: "Yotsuba&!",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Beginner",
      description:
        "Follow the daily life of an energetic young girl named Yotsuba as she explores her new neighborhood.",
    },
    {
      id: 2,
      title: "ドラえもん",
      englishTitle: "Doraemon",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Beginner-Intermediate",
      description: "The adventures of a robotic cat from the future who helps a young boy with various gadgets.",
    },
    {
      id: 3,
      title: "ワンピース",
      englishTitle: "One Piece",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Intermediate",
      description:
        "Follow Monkey D. Luffy and his crew as they search for the world's ultimate treasure, the One Piece.",
    },
  ]

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
            {featuredStories.map((story) => (
              <Card key={story.id} className="overflow-hidden">
                <div className="aspect-[3/4] relative">
                  <Image
                    src={story.cover || "/placeholder.svg"}
                    alt={story.englishTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{story.title}</CardTitle>
                      <CardDescription>{story.englishTitle}</CardDescription>
                    </div>
                    <Badge>{story.difficulty}</Badge>
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
            ))}
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

