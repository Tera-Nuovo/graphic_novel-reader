"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [setupKey, setSetupKey] = useState("")
  const [showSetupKeyInput, setShowSetupKeyInput] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple security check - require a setup key
    // In a real app, you'd want something more secure
    if (showSetupKeyInput) {
      if (setupKey === "setup-graphic-novel-admin") {
        setShowSetupKeyInput(false)
        return
      } else {
        toast({
          title: "Invalid setup key",
          description: "Please enter the correct setup key",
          variant: "destructive",
        })
        return
      }
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set user as admin')
      }
      
      toast({
        title: "Success",
        description: `User ${email} has been set as an admin`,
      })
      
      setEmail("")
    } catch (error: any) {
      console.error("Error setting admin:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to set user as admin",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <CardDescription>
            {showSetupKeyInput 
              ? "Enter the setup key to continue" 
              : "Set a user as an admin by entering their email address"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {showSetupKeyInput ? (
              <div className="space-y-2">
                <Label htmlFor="setup-key">Setup Key</Label>
                <Input 
                  id="setup-key" 
                  type="password" 
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  required 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="user@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  This user will be granted admin privileges
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : (showSetupKeyInput ? "Continue" : "Set as Admin")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 