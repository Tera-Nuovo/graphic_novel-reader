import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { 
  Home, 
  Book, 
  BookOpen, 
  Layers, 
  PanelTop, 
  FileText, 
  Settings,
  Upload
} from "lucide-react";

interface SidebarNavProps {
  className?: string;
}

export function SidebarNavAdmin({ className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      <Link
        href="/admin"
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          pathname === "/admin" ? "bg-accent" : "transparent"
        )}
      >
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      <Link
        href="/admin/create"
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          pathname === "/admin/create" ? "bg-accent" : "transparent"
        )}
      >
        <BookOpen className="h-4 w-4" />
        <span>Create Story</span>
      </Link>
      <Link
        href="/admin/import"
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          pathname === "/admin/import" ? "bg-accent" : "transparent"
        )}
      >
        <Upload className="h-4 w-4" />
        <span>Import Story</span>
      </Link>
      <Link
        href="/admin/stories"
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          pathname.startsWith("/admin/stories") ? "bg-accent" : "transparent"
        )}
      >
        <Book className="h-4 w-4" />
        <span>Stories</span>
      </Link>
    </nav>
  );
} 