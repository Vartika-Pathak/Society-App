import React from "react";
import { useParams, Link } from "wouter";
import { useGetNewsPost } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format-date";
import { ArrowLeft, User, Calendar, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsPost() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { data: post, isLoading } = useGetNewsPost(id, { 
    query: { enabled: !!id, queryKey: ['getNewsPost', id] } 
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-16 max-w-3xl">
        <Skeleton className="h-8 w-24 mb-12" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-3/4 mb-8" />
        <div className="flex gap-4 mb-12">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl mb-12" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-serif font-medium mb-4">Post not found</h2>
        <p className="text-muted-foreground mb-8">The news article you're looking for doesn't exist.</p>
        <Link href="/news">
          <Button variant="outline" className="rounded-full">Return to News</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="w-full pb-24">
      <div className="container mx-auto px-4 md:px-8 pt-12 pb-8 max-w-3xl">
        <Link href="/news" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notice Board
        </Link>

        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
          </div>
        </header>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-4xl mb-12">
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border">
          {post.imageUrl ? (
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Newspaper className="h-20 w-20 opacity-20" />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="prose prose-lg md:prose-xl prose-stone dark:prose-invert prose-headings:font-serif prose-a:text-primary max-w-none">
          {/* Simple splitting by newlines for paragraphs since we don't have MD rendering */}
          {post.content.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        
        <div className="mt-16 pt-8 border-t flex justify-center">
          <Link href="/news">
            <Button variant="outline" className="rounded-full">Read More News</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
