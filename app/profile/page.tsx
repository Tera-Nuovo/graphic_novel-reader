import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  // Mock user data
  const user = {
    name: "John Doe",
    email: "john@example.com",
    joinDate: "January 2023",
    readingStreak: 7,
    wordsLearned: 342,
    level: "Intermediate",
  }

  // Mock reading history
  const readingHistory = [
    {
      id: 1,
      title: "よつばと!",
      englishTitle: "Yotsuba&!",
      cover: "/placeholder.svg?height=400&width=300",
      progress: 60,
      lastRead: "2 days ago",
    },
    {
      id: 3,
      title: "ワンピース",
      englishTitle: "One Piece",
      cover: "/placeholder.svg?height=400&width=300",
      progress: 25,
      lastRead: "1 week ago",
    },
    {
      id: 4,
      title: "鬼滅の刃",
      englishTitle: "Demon Slayer",
      cover: "/placeholder.svg?height=400&width=300",
      progress: 10,
      lastRead: "2 weeks ago",
    },
  ]

  // Mock bookmarks
  const bookmarks = [
    {
      id: 1,
      title: "よつばと!",
      englishTitle: "Yotsuba&!",
      cover: "/placeholder.svg?height=400&width=300",
      chapter: 3,
      page: 12,
      addedDate: "3 days ago",
    },
    {
      id: 2,
      title: "ドラえもん",
      englishTitle: "Doraemon",
      cover: "/placeholder.svg?height=400&width=300",
      chapter: 5,
      page: 7,
      addedDate: "1 week ago",
    },
  ]

  // Mock vocabulary list
  const vocabulary = [
    {
      word: "元気",
      reading: "genki",
      translation: "energy, vitality, vigor, health",
      lastReviewed: "2 days ago",
      mastery: 80,
    },
    {
      word: "名前",
      reading: "namae",
      translation: "name",
      lastReviewed: "3 days ago",
      mastery: 90,
    },
    {
      word: "学校",
      reading: "gakkou",
      translation: "school",
      lastReviewed: "1 week ago",
      mastery: 70,
    },
    {
      word: "友達",
      reading: "tomodachi",
      translation: "friend",
      lastReviewed: "5 days ago",
      mastery: 85,
    },
    {
      word: "家族",
      reading: "kazoku",
      translation: "family",
      lastReviewed: "2 weeks ago",
      mastery: 60,
    },
  ]

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8">
        {/* User Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          <div className="relative w-24 h-24">
            <Image
              src="/placeholder.svg?height=100&width=100&text=JD"
              alt="Profile"
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge>Member since {user.joinDate}</Badge>
              <Badge variant="outline">{user.level} Level</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <Button asChild>
              <Link href="/settings">Edit Profile</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.readingStreak} days</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Words Learned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.wordsLearned}</div>
              <p className="text-xs text-muted-foreground">Vocabulary mastered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reading Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.level}</div>
              <p className="text-xs text-muted-foreground">Based on your activity</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="reading-history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reading-history">Reading History</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          </TabsList>

          {/* Reading History Tab */}
          <TabsContent value="reading-history" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {readingHistory.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="relative w-24 h-32">
                      <Image
                        src={item.cover || "/placeholder.svg"}
                        alt={item.englishTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.englishTitle}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2 mt-1" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Last read: {item.lastRead}</p>
                      <Button size="sm" className="mt-2" asChild>
                        <Link href={`/reader/${item.id}`}>Continue</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="relative w-24 h-32">
                      <Image
                        src={bookmark.cover || "/placeholder.svg"}
                        alt={bookmark.englishTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <h3 className="font-bold">{bookmark.title}</h3>
                      <p className="text-sm text-muted-foreground">{bookmark.englishTitle}</p>
                      <p className="text-sm mt-2">
                        Chapter {bookmark.chapter}, Page {bookmark.page}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Bookmarked: {bookmark.addedDate}</p>
                      <Button size="sm" className="mt-2" asChild>
                        <Link href={`/reader/${bookmark.id}?chapter=${bookmark.chapter}&page=${bookmark.page}`}>
                          Go to Bookmark
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vocabulary Tab */}
          <TabsContent value="vocabulary" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary List</CardTitle>
                <CardDescription>Words you've learned while reading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vocabulary.map((word, index) => (
                    <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-bold">{word.word}</h4>
                          <span className="text-sm text-muted-foreground">[{word.reading}]</span>
                        </div>
                        <p className="text-sm">{word.translation}</p>
                        <p className="text-xs text-muted-foreground">Last reviewed: {word.lastReviewed}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Mastery:</span>
                          <span className="text-sm font-medium">{word.mastery}%</span>
                        </div>
                        <Progress value={word.mastery} className="w-24 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

