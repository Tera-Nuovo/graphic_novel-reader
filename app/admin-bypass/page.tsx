"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminBypassPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const goToAdmin = () => {
    setLoading(true)
    // Use client-side navigation to bypass middleware
    router.push('/admin')
  }
  
  return (
    <div className="container py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Dashboard Bypass</CardTitle>
          <CardDescription>
            Use this page to bypass the middleware and access the admin dashboard directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This page provides direct links to admin pages, bypassing the server middleware.
            Use this if you're having trouble accessing the admin dashboard through the normal route.
          </p>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Note:</strong> This is a temporary workaround. Some admin features might not work correctly
              if the middleware is not properly authenticating your session.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            onClick={goToAdmin}
            disabled={loading}
          >
            {loading ? "Navigating..." : "Go to Admin Dashboard"}
          </Button>
          
          <div className="flex flex-col space-y-2 w-full text-center">
            <p className="text-sm text-muted-foreground">Or use these direct links:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Admin Home</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/create">Create Story</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 