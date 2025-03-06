"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { requiredBuckets } from "@/lib/storage-utils"

export default function SetupPage() {
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [bucketStatus, setBucketStatus] = useState<Record<string, boolean>>({})
  const [policyStatus, setPolicyStatus] = useState<boolean>(false)
  
  // Check storage setup on page load
  useEffect(() => {
    async function checkSetup() {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Check buckets
        const { data: buckets, error } = await supabase.storage.listBuckets()
        
        if (error) {
          throw error
        }
        
        // Get status of each required bucket
        const bucketMap: Record<string, boolean> = {}
        requiredBuckets.forEach(bucket => {
          bucketMap[bucket] = !!buckets?.find(b => b.name === bucket)
        })
        
        setBucketStatus(bucketMap)
        
        // Check if we have all required buckets
        const allBucketsExist = requiredBuckets.every(bucket => 
          buckets?.some(b => b.name === bucket)
        )
        
        // For now, we'll just assume policies aren't set if we don't have all buckets
        setPolicyStatus(false)
        
      } catch (error) {
        console.error("Error checking setup:", error)
        toast({
          title: "Error",
          description: "Failed to check storage setup",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSetup()
  }, [user, toast])
  
  // Create all required buckets
  const handleCreateBuckets = async () => {
    try {
      setIsBusy(true)
      
      // Call our API endpoint
      const response = await fetch('/api/storage/ensure-buckets')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Buckets Created",
          description: "Storage buckets have been created successfully",
        })
        
        // Update bucket status
        const newBucketStatus = { ...bucketStatus }
        requiredBuckets.forEach(bucket => {
          newBucketStatus[bucket] = true
        })
        setBucketStatus(newBucketStatus)
      } else {
        throw new Error(data.error || "Failed to create all buckets")
      }
    } catch (error) {
      console.error("Error creating buckets:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create buckets",
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }
  
  // Configure RLS policies
  const handleConfigurePolicies = async () => {
    try {
      setIsBusy(true)
      
      // Call our API endpoint
      const response = await fetch('/api/storage/configure-policies')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Policies Configured",
          description: "Storage policies have been configured successfully",
        })
        
        setPolicyStatus(true)
      } else {
        throw new Error(data.error || "Failed to configure policies")
      }
    } catch (error) {
      console.error("Error configuring policies:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to configure policies",
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }
  
  // Apply SQL script directly
  const handleApplySql = async () => {
    try {
      setIsBusy(true)
      
      // Fetch the SQL script
      const response = await fetch('/lib/sql/enable_bucket_public_access.sql')
      if (!response.ok) {
        throw new Error("Failed to load SQL script")
      }
      
      const sql = await response.text()
      
      // Execute the SQL via our API
      const sqlResponse = await fetch('/api/admin/run-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      })
      
      if (!sqlResponse.ok) {
        const errorData = await sqlResponse.json()
        throw new Error(errorData.error || sqlResponse.statusText)
      }
      
      toast({
        title: "SQL Applied",
        description: "SQL script has been executed successfully",
      })
      
      // Now try to apply policies 
      await handleConfigurePolicies()
      
    } catch (error) {
      console.error("Error applying SQL:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply SQL",
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }
  
  // Apply direct policy setup
  const handleDirectSetup = async () => {
    try {
      setIsBusy(true);
      
      // Call our API endpoint for direct setup without custom SQL functions
      const response = await fetch('/api/storage/direct-policy-setup');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Storage Setup Completed",
          description: data.message || "Storage has been configured successfully",
        });
        
        // Update bucket status
        if (data.buckets) {
          const newBucketStatus = { ...bucketStatus };
          data.buckets.forEach((bucket: string) => {
            newBucketStatus[bucket] = true;
          });
          setBucketStatus(newBucketStatus);
        }
        
        // Update policy status
        setPolicyStatus(!data.manualInstructions);
        
        // If manual instructions are required, show a more specific toast
        if (data.manualInstructions) {
          toast({
            title: "Manual Configuration Required",
            description: "Some steps need to be completed manually in Supabase. See instructions below.",
            duration: 8000,
          });
        }
      } else {
        throw new Error(data.error || "Failed to set up storage");
      }
    } catch (error) {
      console.error("Error setting up storage:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set up storage",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };
  
  if (!user || !isAdmin) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in as an admin to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Checking storage setup...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Storage Setup</h1>
          <p className="text-muted-foreground">Configure storage for image uploads</p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage Buckets</CardTitle>
            <CardDescription>
              Check and create required storage buckets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredBuckets.map(bucket => (
                <div key={bucket} className="flex items-center justify-between">
                  <span>{bucket}</span>
                  {bucketStatus[bucket] ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-4 w-4 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreateBuckets} 
              disabled={isBusy || Object.values(bucketStatus).every(v => v)}
              className="w-full"
            >
              {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Missing Buckets
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Storage Policies</CardTitle>
            <CardDescription>
              Configure row-level security policies for storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Public Access Policies</span>
                {policyStatus ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <XCircle className="h-4 w-4 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
              
              <Alert className="mt-4">
                <AlertTitle>Supabase Management</AlertTitle>
                <AlertDescription>
                  If automatic policy configuration doesn't work, you can manage storage 
                  permissions directly in the Supabase dashboard: 
                  Storage → Buckets → Policy Editor
                </AlertDescription>
              </Alert>
              
              {/* Manual configuration instructions */}
              <div className="mt-6 p-4 border rounded-md bg-slate-50">
                <h4 className="font-medium mb-2">Manual Configuration Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your <a href="https://supabase.com/dashboard/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Select your project</li>
                  <li>Navigate to <strong>Storage</strong> in the left sidebar</li>
                  <li>For each bucket (<code>stories</code> and <code>panels</code>):</li>
                  <li className="ml-6">Click the bucket name</li>
                  <li className="ml-6">Go to <strong>Policies</strong> tab</li>
                  <li className="ml-6">Click <strong>Create Policy</strong> (do this 4 times):</li>
                  <li className="ml-8">
                    <strong>Policy 1:</strong> Allow public read access<br />
                    <span className="text-xs text-gray-600">
                      Name: <code>Public Read</code><br />
                      Operation: <code>SELECT</code><br />
                      Policy definition: <code>true</code> or <code>()</code>
                    </span>
                  </li>
                  <li className="ml-8">
                    <strong>Policy 2:</strong> Allow authenticated uploads<br />
                    <span className="text-xs text-gray-600">
                      Name: <code>Auth Insert</code><br />
                      Operation: <code>INSERT</code><br />
                      Policy definition: <code>auth.role() = 'authenticated'</code>
                    </span>
                  </li>
                  <li className="ml-8">
                    <strong>Policy 3:</strong> Allow authenticated updates<br />
                    <span className="text-xs text-gray-600">
                      Name: <code>Auth Update</code><br />
                      Operation: <code>UPDATE</code><br />
                      Policy definition: <code>auth.role() = 'authenticated'</code>
                    </span>
                  </li>
                  <li className="ml-8">
                    <strong>Policy 4:</strong> Allow authenticated deletes<br />
                    <span className="text-xs text-gray-600">
                      Name: <code>Auth Delete</code><br />
                      Operation: <code>DELETE</code><br />
                      Policy definition: <code>auth.role() = 'authenticated'</code>
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              onClick={handleConfigurePolicies} 
              disabled={isBusy || !Object.values(bucketStatus).every(v => v) || policyStatus}
              className="w-full"
            >
              {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Configure Policies
            </Button>
            
            <Button 
              onClick={handleDirectSetup}
              disabled={isBusy}
              variant="secondary"
              className="w-full"
            >
              {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              One-Click Setup (Recommended)
            </Button>
            
            <Button 
              onClick={handleApplySql} 
              disabled={isBusy || !Object.values(bucketStatus).every(v => v)}
              variant="outline"
              className="w-full"
            >
              {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Apply SQL Directly (Advanced)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 