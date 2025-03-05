"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { AlertTriangle } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, isAdmin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState({
    email: "",
    username: "",
  })

  useEffect(() => {
    if (user) {
      setUserProfile({
        email: user.email || "",
        username: user.user_metadata?.username || "",
      })
    }
  }, [user])

  // If no user is logged in, show a message
  if (!user) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Authentication Required</CardTitle>
            </div>
            <CardDescription>
              You need to be logged in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Please log in to access your profile and account settings.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setIsLoading(true)
      
      const { error } = await supabase.auth.updateUser({
        data: { username: userProfile.username }
      })
      
      if (error) throw error
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      console.error("Update profile error:", error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      })
      router.push("/")
    } catch (error: any) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
          <CardDescription>
            View and update your account information
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={userProfile.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={userProfile.username}
                onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
              />
            </div>
            {isAdmin && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-400">
                  You have admin privileges
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex w-full gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
            {isAdmin && (
              <div className="flex w-full gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/admin")}
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

