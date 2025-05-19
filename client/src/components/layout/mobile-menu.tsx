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
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: Layers },
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

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold text-primary">ProductiTask</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name}
              href={item.href}
              onClick={onClose}
            >
              <a className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-secondary text-primary" 
                  : "text-foreground hover:bg-secondary/50"
              )}>
                <Icon className={cn(
                  "h-5 w-5 mr-3",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
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
            onClick={() => {
              logoutMutation.mutate();
              onClose();
            }}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
