"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { AlertCircle, RefreshCw } from "lucide-react"
import CookieDebug from "./cookie-debug"
import { supabase } from "@/lib/supabase"

export default function CheckAdminPage() {
  const router = useRouter()
  const { user, isAdmin, refreshUser, goToAdmin } = useAuth()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  
  useEffect(() => {
    // Get the current session to retrieve the access token
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        console.log("Access token retrieved from session:", session.access_token.substring(0, 15) + "...");
      } else {
        console.log("No active session found");
      }
    };
    
    getSession();
    
    // Get the Supabase auth data from localStorage
    if (typeof window !== 'undefined') {
      try {
        const supabaseData = localStorage.getItem('supabase.auth.token');
        if (supabaseData) {
          const parsedData = JSON.parse(supabaseData);
          setLocalStorageData(parsedData);
        }
      } catch (e) {
        console.error('Error getting data from localStorage:', e);
      }
    }
  }, []);
  
  const checkAdminAPI = async () => {
    try {
      setLoading(true)
      
      // Get the current session to ensure we have the latest access token
      const { data: { session } } = await supabase.auth.getSession();
      const currentToken = session?.access_token || accessToken;
      
      if (!currentToken) {
        console.error("No access token available");
        setApiResponse({ error: "No access token available" });
        return;
      }
      
      console.log("Using access token:", currentToken.substring(0, 15) + "...");
      
      // Make the API request with the authorization header
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      };
      
      console.log('Request headers:', headers);
      
      // Make the request and include the raw response in the result
      const response = await fetch('/api/check-admin', {
        headers
      });
      
      const data = await response.json();
      
      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      setApiResponse({ error: 'Failed to check admin status', details: String(error) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshUser = async () => {
    try {
      setRefreshing(true)
      await refreshUser()
      
      // Refresh the access token
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
      }
      
      // Refresh localStorage data
      if (typeof window !== 'undefined') {
        try {
          const supabaseData = localStorage.getItem('supabase.auth.token');
          if (supabaseData) {
            const parsedData = JSON.parse(supabaseData);
            setLocalStorageData(parsedData);
          }
        } catch (e) {
          console.error('Error getting data from localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    } finally {
      setRefreshing(false)
    }
  };
  
  return (
    <div className="container py-8 space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Admin Status Check</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefreshUser}
              disabled={refreshing}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Check if you have admin privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Auth Context</h3>
            <div className="rounded-md bg-muted p-4">
              <p><strong>Authenticated:</strong> {user ? 'Yes' : 'No'}</p>
              {user && (
                <>
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                  <p><strong>User Metadata:</strong> {JSON.stringify(user.user_metadata)}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Session Data</h3>
            <div className="rounded-md bg-muted p-4">
              <p><strong>Has Access Token:</strong> {accessToken ? 'Yes' : 'No'}</p>
              {accessToken && (
                <p><strong>Access Token:</strong> {accessToken.substring(0, 15)}...</p>
              )}
            </div>
          </div>
          
          {localStorageData && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">LocalStorage Data</h3>
              <div className="rounded-md bg-muted p-4">
                <p><strong>Has Access Token:</strong> {localStorageData.currentSession?.access_token ? 'Yes' : 'No'}</p>
                {localStorageData.currentSession?.access_token && (
                  <p><strong>Access Token:</strong> {localStorageData.currentSession.access_token.substring(0, 15)}...</p>
                )}
                <p><strong>Expires At:</strong> {localStorageData.currentSession?.expires_at ? new Date(localStorageData.currentSession.expires_at * 1000).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          )}
          
          {apiResponse && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">API Response</h3>
              <div className={`rounded-md p-4 ${apiResponse.error || (apiResponse.data && apiResponse.data.error) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'}`}>
                {apiResponse.error && (
                  <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">{apiResponse.error}</p>
                  </div>
                )}
                {apiResponse.data && apiResponse.data.error && (
                  <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">{apiResponse.data.error}</p>
                  </div>
                )}
                <p><strong>Status:</strong> {apiResponse.status} {apiResponse.statusText}</p>
                <div className="mt-2">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex w-full gap-4">
            <Button 
              onClick={checkAdminAPI} 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Checking..." : "Check Admin API"}
            </Button>
          </div>
          <div className="flex w-full gap-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
            {isAdmin && (
              <Button 
                className="w-full"
                onClick={goToAdmin}
              >
                Go to Admin
              </Button>
            )}
          </div>
          <Button 
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/admin-bypass")}
          >
            Try Admin Bypass
          </Button>
        </CardFooter>
      </Card>
      
      <div className="w-full max-w-md mx-auto">
        <CookieDebug />
      </div>
    </div>
  )
} 