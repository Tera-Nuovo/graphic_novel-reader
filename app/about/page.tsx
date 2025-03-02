import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AboutPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">About Manga Reader</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An interactive manga reader designed to help you learn Japanese through authentic comics
          </p>
        </div>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About the Project</TabsTrigger>
            <TabsTrigger value="how-to-use">How to Use</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p>
                  Manga Reader was created with a simple goal: to make learning Japanese more engaging and effective
                  through authentic manga content. We believe that learning through content you enjoy is the best way to
                  stay motivated and make progress.
                </p>
                <p>
                  Our interactive reader provides furigana support, instant translations, and vocabulary tracking to
                  help you build your Japanese skills while enjoying great stories.
                </p>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="About Manga Reader"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Features</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Furigana Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Reading aids that show the pronunciation of kanji characters, making it easier for beginners to
                      read.
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
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Team</h2>
              <p>
                Manga Reader is developed by a small team of language enthusiasts and developers who are passionate
                about making language learning more accessible and enjoyable.
              </p>
              <div className="flex justify-center mt-6">
                <Button asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="how-to-use" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Getting Started</h2>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="pl-2">
                  <span className="font-medium">Create an account</span> - Sign up to track your progress and save your
                  favorite manga.
                </li>
                <li className="pl-2">
                  <span className="font-medium">Browse the library</span> - Find manga that matches your interest and
                  Japanese level.
                </li>
                <li className="pl-2">
                  <span className="font-medium">Start reading</span> - Open a manga and begin your reading journey.
                </li>
                <li className="pl-2">
                  <span className="font-medium">Interact with the text</span> - Click on words to see translations and
                  readings.
                </li>
                <li className="pl-2">
                  <span className="font-medium">Save vocabulary</span> - Add words to your personal vocabulary list for
                  later review.
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Using the Reader</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Reading with Furigana</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      All kanji in our manga come with furigana (reading aids) to help you pronounce words correctly.
                    </p>
                    <Image
                      src="/placeholder.svg?height=200&width=400&text=Furigana Example"
                      alt="Furigana Example"
                      width={400}
                      height={200}
                      className="rounded-md"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Translations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>Click on any word or phrase to see its translation, reading, and grammatical information.</p>
                    <Image
                      src="/placeholder.svg?height=200&width=400&text=Translation Example"
                      alt="Translation Example"
                      width={400}
                      height={200}
                      className="rounded-md"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Tracking Your Progress</h2>
              <p>
                Your profile page shows your reading history, bookmarks, and vocabulary progress. Use this information
                to track your improvement and focus on areas that need more practice.
              </p>
              <div className="flex justify-center mt-6">
                <Button asChild>
                  <Link href="/profile">Go to Your Profile</Link>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Is Manga Reader free to use?</h3>
                  <p>
                    Manga Reader offers both free and premium content. Basic features and a selection of manga are
                    available for free, while premium subscribers get access to the full library and advanced learning
                    features.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">What Japanese level do I need to use Manga Reader?</h3>
                  <p>
                    Manga Reader is designed for learners of all levels. We have content categorized by difficulty, from
                    absolute beginners to advanced learners. The interactive features make it accessible even if you're
                    just starting out.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Can I use Manga Reader offline?</h3>
                  <p>
                    Yes, premium users can download manga for offline reading. This feature is perfect for studying on
                    the go without an internet connection.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">How accurate are the translations?</h3>
                  <p>
                    Our translations are created by a combination of professional translators and language technology.
                    We strive for accuracy while also providing natural, contextual translations that help you
                    understand both the language and cultural nuances.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Can I contribute to Manga Reader?</h3>
                  <p>
                    Yes! We welcome contributions from the community. If you're interested in helping with translations,
                    content creation, or development, please contact us through the Contact page.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button asChild>
                <Link href="/contact">Still Have Questions? Contact Us</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

