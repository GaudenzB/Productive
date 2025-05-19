import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Menu, Bell, Search } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const { user } = useAuth();

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
    <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className="md:hidden text-xl font-bold text-primary">ProductiTask</div>
      
      {/* Search bar - hidden on mobile */}
      <div className="hidden md:block w-1/3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-8 bg-secondary"
          />
        </div>
      </div>
      
      {/* Right side icons */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8 md:hidden">
          <AvatarFallback className="bg-primary text-white text-xs">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
