import React from "react";
import { Link } from "wouter";
import { useListNewsPosts } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowRight, Newspaper } from "lucide-react";

export default function News() {
  const { data: posts, isLoading } = useListNewsPosts();

  return (
    <div className="w-full pb-24">
      {/* Header */}
      <div className="bg-primary/5 py-12 md:py-20 border-b">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Notice Board</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Official announcements, building updates, and community news.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-6xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-4">
                <Skeleton className="h-56 w-full rounded-2xl" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-3/4" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post) => (
              <Link key={post.id} href={`/news/${post.id}`} className="group flex flex-col h-full">
                <div className="overflow-hidden rounded-2xl mb-6 bg-muted aspect-[4/3] relative border">
                  {post.imageUrl ? (
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Newspaper className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-background/90 backdrop-blur text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                      {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-serif font-medium mb-3 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">By {post.author}</span>
                    <span className="text-primary text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                      Read more <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-3xl border border-dashed max-w-2xl mx-auto">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No news yet</h3>
            <p className="text-muted-foreground">When updates are posted, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
