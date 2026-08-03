import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmitJoinRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { PavilionMark } from "@/components/pavilion-mark";

const joinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  flatNumber: z.string().min(1, "Flat number is required"),
  message: z.string().optional(),
});

type JoinFormValues = z.infer<typeof joinSchema>;

export default function Join() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  
  const submitRequest = useSubmitJoinRequest();
  
  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      name: "",
      email: "",
      flatNumber: "",
      message: "",
    },
  });

  const onSubmit = (data: JoinFormValues) => {
    submitRequest.mutate({ data }, {
      onSuccess: () => {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: () => {
        toast({
          title: "Submission failed",
          description: "There was a problem sending your request. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className="w-full flex-1 flex items-center justify-center py-24 px-4 bg-primary/5">
        <div className="max-w-md w-full bg-card p-10 rounded-3xl shadow-lg border text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif font-medium mb-4">Request Received</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Thank you for applying to join the Pavilion community portal. The committee will verify your residence details and you'll receive an email once approved.
          </p>
          <Link href="/">
            <Button className="w-full rounded-full h-12 text-base">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex">
      {/* Visual side - hidden on mobile */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <PavilionMark className="h-6 w-6" />
            <span className="font-serif text-2xl font-semibold tracking-tight">Pavilion</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md mt-24">
          <h1 className="text-5xl font-serif font-medium leading-tight mb-6">Welcome to the neighborhood.</h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Join the digital community to connect with neighbors, stay updated on building news, and participate in social events.
          </p>
        </div>
        <div className="relative z-10 text-sm text-primary-foreground/60 mt-auto pt-24">
          For residents of Pavilion only.
        </div>
      </div>

      {/* Form side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-16 px-4 md:px-12 bg-background">
        <div className="max-w-md w-full">
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-primary mb-6">
              <PavilionMark className="h-8 w-8" />
            </Link>
            <h1 className="text-3xl font-serif font-medium mb-3">Join Community</h1>
            <p className="text-muted-foreground">Apply for access to the resident portal.</p>
          </div>
          
          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-serif font-medium mb-3">Apply for Access</h2>
            <p className="text-muted-foreground">Please fill out your details to verify residency.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="h-12 rounded-xl bg-muted/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" className="h-12 rounded-xl bg-muted/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="flatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Flat Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 4B" className="h-12 rounded-xl bg-muted/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Optional Message (e.g. moving date)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hello, I just moved in last week..." 
                        className="min-h-32 rounded-xl bg-muted/50 resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-medium shadow-sm"
                disabled={submitRequest.isPending}
              >
                {submitRequest.isPending ? "Submitting..." : "Submit Application"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-6">
                By submitting this form, you confirm that you are a current resident of Pavilion.
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
