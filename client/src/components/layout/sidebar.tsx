import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users,
  BarChart, 
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Agents",
    icon: Users,
    href: "/agents",
  },
  {
    label: "Analytics",
    icon: BarChart,
    href: "/analytics",
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={location === item.href ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                location === item.href && "bg-primary text-primary-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader className="mb-4">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden lg:flex h-full w-64 flex-col gap-4 border-r p-4">
      <SidebarContent />
    </div>
  );
}