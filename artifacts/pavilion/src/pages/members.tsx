import React, { useState } from "react";
import { useListMembers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Members() {
  const { data: members, isLoading } = useListMembers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members?.filter((member) => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full pb-24">
      {/* Header */}
      <div className="bg-primary/5 py-12 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-serif font-medium mb-4">Resident Directory</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Get to know your neighbors. A connected building is a safer, happier place to live.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or flat number..." 
                  className="pl-10 h-12 bg-background border-border/60 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href="/join">
                <Button className="h-12 px-6 rounded-xl shrink-0">
                  <UserPlus className="mr-2 h-4 w-4" /> Add Yourself
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 pt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border rounded-2xl p-6 flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-16 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers && filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <div key={member.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {member.avatarUrl ? (
                      <img 
                        src={member.avatarUrl} 
                        alt={member.name} 
                        className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-sm"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xl font-serif shadow-sm">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-lg leading-tight group-hover:text-primary transition-colors">{member.name}</h3>
                      <div className="flex items-center text-primary font-medium text-sm mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        Flat {member.flatNumber}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 mb-4 flex-1">
                  {member.bio ? (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic opacity-70">
                      No bio provided.
                    </p>
                  )}
                </div>
                
                <div className="pt-4 border-t text-xs text-muted-foreground mt-auto flex items-center justify-between">
                  <span>Joined {format(new Date(member.joinedAt), 'MMM yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-2xl border border-dashed">
            <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-medium mb-2">No residents found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchQuery 
                ? `We couldn't find anyone matching "${searchQuery}". Try a different name or flat number.`
                : "The directory is currently empty. Be the first to join!"}
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-6 rounded-full"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
