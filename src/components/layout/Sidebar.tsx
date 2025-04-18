import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  FolderOpen, 
  Image, 
  Video, 
  FileAudio, 
  FileText, 
  Star, 
  HardDrive, 
  Upload
} from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "All Files", href: "/dashboard?type=all", icon: FolderOpen },
    { name: "Images", href: "/dashboard?type=image", icon: Image },
    { name: "Videos", href: "/dashboard?type=video", icon: Video },
    { name: "Audio", href: "/dashboard?type=audio", icon: FileAudio },
    { name: "Documents", href: "/dashboard?type=document", icon: FileText },
    { name: "Favorites", href: "/dashboard?favorite=true", icon: Star },
  ];

  // Get storage info from localStorage or default values
  const storageInfo = {
    total: localStorage.getItem('pvcStorageTotal') || "10",
    used: localStorage.getItem('pvcStorageUsed') || "4.5"
  };

  const usedPercentage = (Number(storageInfo.used) / Number(storageInfo.total)) * 100;

  return (
    <aside className="w-full md:w-64 border-r bg-background">
      <div className="flex flex-col h-full py-4">
        <div className="px-4 mb-6">
          <Link to="/dashboard">
            <div className="flex items-center">
              <HardDrive className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-bold">Kalimaya Storage</h2>
            </div>
          </Link>
        </div>
        
        <div className="px-4 mb-6">
          <Button className="w-full flex items-center" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
        
        <nav className="space-y-1 px-2 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href.includes('?') && location.pathname + location.search === item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-4 mt-6">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Storage (PVC)</p>
                <div className="mt-1">
                  <div className="h-2 bg-secondary/30 rounded">
                    <div 
                      className="h-2 bg-secondary rounded" 
                      style={{ width: `${usedPercentage}%` }} 
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {storageInfo.used} GB used of {storageInfo.total} GB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
