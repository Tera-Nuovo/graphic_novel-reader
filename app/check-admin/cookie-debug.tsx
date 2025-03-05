"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CookieDebug() {
  const [cookies, setCookies] = useState<string>("")
  
  useEffect(() => {
    setCookies(document.cookie)
  }, [])
  
  const refreshCookies = () => {
    setCookies(document.cookie)
  }
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Browser Cookies</CardTitle>
          <Button variant="outline" size="sm" onClick={refreshCookies}>
            Refresh Cookies
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-xs overflow-auto whitespace-pre-wrap">
            {cookies ? cookies.split(';').map(c => c.trim()).join('\n') : 'No cookies found'}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
} 