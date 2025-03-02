import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BrowsePage() {
  // Sample manga data
  const mangaList = [
    {
      id: 1,
      title: "よつばと!",
      englishTitle: "Yotsuba&!",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Beginner",
      description:
        "Follow the daily life of an energetic young girl named Yotsuba as she explores her new neighborhood.",
      tags: ["Slice of Life", "Comedy", "Everyday Life"],
    },
    {
      id: 2,
      title: "ドラえもん",
      englishTitle: "Doraemon",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Beginner-Intermediate",
      description: "The adventures of a robotic cat from the future who helps a young boy with various gadgets.",
      tags: ["Comedy", "Sci-Fi", "Children"],
    },
    {
      id: 3,
      title: "ワンピース",
      englishTitle: "One Piece",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Intermediate",
      description:
        "Follow Monkey D. Luffy and his crew as they search for the world's ultimate treasure, the One Piece.",
      tags: ["Adventure", "Fantasy", "Action"],
    },
    {
      id: 4,
      title: "鬼滅の刃",
      englishTitle: "Demon Slayer",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Intermediate",
      description:
        "Tanjiro Kamado sets out to become a demon slayer after his family is slaughtered and his sister is turned into a demon.",
      tags: ["Action", "Supernatural", "Historical"],
    },
    {
      id: 5,
      title: "進撃の巨人",
      englishTitle: "Attack on Titan",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Advanced",
      description:
        "In a world where humanity lives within cities surrounded by enormous walls due to the Titans, giant humanoid creatures who devour humans seemingly without reason.",
      tags: ["Action", "Drama", "Fantasy", "Mystery"],
    },
    {
      id: 6,
      title: "名探偵コナン",
      englishTitle: "Detective Conan",
      cover: "/placeholder.svg?height=400&width=300",
      difficulty: "Intermediate-Advanced",
      description:
        "A high school detective who was transformed into a child while investigating a mysterious organization and solves mysteries while looking for a cure.",
      tags: ["Mystery", "Detective", "Crime Fiction"],
    },
  ]

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
            <Input type="search" placeholder="Search titles, authors, or tags..." className="flex-1" />
            <Button type="submit">Search</Button>
          </div>
          <Select>
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
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Showing {mangaList.length} results</div>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </div>

          {/* Grid View */}
          <TabsContent value="grid" className="mt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mangaList.map((manga) => (
                <Card key={manga.id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={manga.cover || "/placeholder.svg"}
                      alt={manga.englishTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{manga.title}</CardTitle>
                        <CardDescription>{manga.englishTitle}</CardDescription>
                      </div>
                      <Badge>{manga.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{manga.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {manga.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/reader/${manga.id}`}>Start Reading</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            <div className="flex flex-col space-y-4">
              {mangaList.map((manga) => (
                <Card key={manga.id}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-[150px] h-[200px]">
                      <Image
                        src={manga.cover || "/placeholder.svg"}
                        alt={manga.englishTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{manga.title}</h3>
                          <p className="text-sm text-muted-foreground">{manga.englishTitle}</p>
                        </div>
                        <Badge>{manga.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{manga.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {manga.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-auto pt-4">
                        <Button asChild size="sm">
                          <Link href={`/reader/${manga.id}`}>Start Reading</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

