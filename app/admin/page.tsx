"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Book, BookOpen, Settings, Users, AlertTriangle, Download, Upload, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Story } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AdminDashboard() {
  const router = useRouter()

  const { user, isAdmin, refreshUser } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingStory, setIsDeletingStory] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null)
  const [stats, setStats] = useState({
    totalStories: 0,
    totalChapters: 0,
    activeUsers: 0
  })

  // Function to clear cookies and refresh tokens if there's an error
  const clearAuthCookiesAndRefresh = async () => {
    console.log('Clearing auth cookies and refreshing tokens...')
    
    // Clear all Supabase cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')
      if (name.includes('sb-')) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
      }
    })
    
    // Get a fresh session and set cookies
    try {
      const { data } = await supabase.auth.getSession()
      
      if (data?.session) {
        const maxAge = 60 * 60 * 24 * 30 // 30 days
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`
        
        // Refresh user data
        await refreshUser()
        return true
      }
    } catch (e) {
      console.error('Error refreshing session:', e)
    }
    
    return false
  }

  // Handle story deletion
  const handleDeleteStory = async (story: Story) => {
    try {
      setIsDeletingStory(true)
      
      // Delete the story from the database
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id)
      
      if (error) {
        console.error('Error deleting story:', error)
        toast({
          title: "Delete Failed",
          description: `Failed to delete "${story.english_title}". ${error.message}`,
          variant: "destructive",
        })
        return
      }
      
      // Update the stories list
      setStories(stories.filter(s => s.id !== story.id))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalStories: prev.totalStories - 1
      }))
      
      toast({
        title: "Story Deleted",
        description: `"${story.english_title}" has been deleted successfully.`
      })
      
    } catch (error) {
      console.error('Error in delete process:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingStory(false)
      setStoryToDelete(null)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    async function fetchData() {
      if (!user) return

      try {
        setIsLoading(true)
        
        // Fetch stories
        let storiesData: any[] = []
        let chaptersCount = 0
        
        // First attempt to get stories
        const { data: initialStoriesData, error: storiesError } = await supabase
          .from('stories')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (storiesError) {
          // If we get an error, try to refresh the tokens
          console.error('Error fetching stories:', storiesError)
          if (await clearAuthCookiesAndRefresh()) {
            // Try once more after refreshing tokens
            const { data: retryData, error: retryError } = await supabase
              .from('stories')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (retryError) throw retryError
            storiesData = retryData || []
          } else {
            throw storiesError
          }
        } else {
          storiesData = initialStoriesData || []
        }
        
        // Fetch chapter count
        const { count: initialChaptersCount, error: chaptersError } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true })
        
        if (chaptersError) {
          // If we get an error, try to refresh the tokens if we haven't already
          console.error('Error fetching chapter count:', chaptersError)
          if (await clearAuthCookiesAndRefresh()) {
            // Try once more after refreshing tokens
            const { count: retryCount, error: retryError } = await supabase
              .from('chapters')
              .select('*', { count: 'exact', head: true })
            
            if (retryError) throw retryError
            chaptersCount = retryCount || 0
          } else {
            throw chaptersError
          }
        } else {
          chaptersCount = initialChaptersCount || 0
        }
        
        // Set the data
        if (isMounted) {
          setStories(storiesData as Story[])
          setStats({
            totalStories: storiesData.length,
            totalChapters: chaptersCount,
            activeUsers: 256 // This would typically come from a real analytics source
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast({
          title: "Authentication Error",
          description: "Please refresh the page or sign in again",
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }


    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [user, refreshUser])

  // If not admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="container py-10">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              To get admin access, please contact the system administrator or visit the admin setup page.
            </p>
            <Button asChild>
              <Link href="/admin-setup">Go to Admin Setup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stats data for the dashboard
  const statsItems = [
    { title: "Total Stories", value: stats.totalStories.toString(), icon: Book },
    { title: "Total Chapters", value: stats.totalChapters.toString(), icon: BookOpen },
    { title: "Active Users", value: stats.activeUsers.toString(), icon: Users },
  ]

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New Story
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {statsItems.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/create">
            <Plus className="h-5 w-5" />
            <span>New Story</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/chapters/create">
            <BookOpen className="h-5 w-5" />
            <span>New Chapter</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/import">
            <div className="flex flex-col items-center">
              <div className="flex">
                <Upload className="h-5 w-5 mr-1" />
                <Download className="h-5 w-5 ml-1" />
              </div>
              <span>Import/Export</span>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/users">
            <Users className="h-5 w-5" />
            <span>Manage Users</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
          <Link href="/admin/settings">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </Button>
      </div>

      {/* Stories List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stories</CardTitle>
          <CardDescription>Manage your created stories and chapters</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading stories...</div>
          ) : stories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No stories found. Create your first story!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">Japanese Title</th>
                    <th className="text-left py-3 px-4 font-medium">English Title</th>
                    <th className="text-left py-3 px-4 font-medium">Difficulty</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id} className="border-b">
                      <td className="py-3 px-4">{story.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4">{story.japanese_title}</td>
                      <td className="py-3 px-4">{story.english_title}</td>
                      <td className="py-3 px-4">{story.difficulty_level}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            story.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/stories/${story.id}`}>Edit</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/stories/${story.id}/chapters`}>Chapters</Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 border-red-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => setStoryToDelete(story)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Story</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{story.english_title}"? 
                                  This action will permanently delete the story and all its chapters, panels, sentences, and words.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setStoryToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteStory(story)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={isDeletingStory}
                                >
                                  {isDeletingStory ? "Deleting..." : "Delete Story"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 