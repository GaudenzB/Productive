import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  Calendar,
  FileText,
  Tag,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: Layers },
    { name: "Kanban Board", href: "/tasks-kanban", icon: FolderKanban },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Meetings", href: "/meetings", icon: Calendar },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Tags", href: "/tags", icon: Tag },
  ];

  // Generate user initials for the avatar
  const getUserInitials = () => {
    if (!user) return "?";
    if (user.name) {
      const nameParts = user.name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-primary">ProductiTask</h1>
      </div>
      
      <div className="py-4 flex flex-col flex-grow overflow-y-auto">
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <div key={item.name} className="w-full">
                <Link href={item.href}>
                  <div className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                    isActive 
                      ? "bg-secondary text-primary" 
                      : "text-foreground hover:bg-secondary/50"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 mr-3",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {item.name}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 mr-2">
              <AvatarFallback className="bg-primary text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              {user?.name && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => logoutMutation.mutate()}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
