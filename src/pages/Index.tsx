import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { DailyPoll } from "@/components/DailyPoll";
import { MyResponses } from "@/components/MyResponses";
import { SubmitQuestion } from "@/components/SubmitQuestion";
import { FeedbackForm } from "@/components/FeedbackForm";
import { WeeklyChallenge, DailyLocked } from "@/components/WeeklyChallenge";
import { FlipCard } from "@/components/FlipCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Vote, History, Lightbulb } from "lucide-react";

const Index = () => {
  const [weeklyUnlocked, setWeeklyUnlocked] = useState<boolean | null>(null);


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Your Topics — One World Dashboard</title>
        <meta name="description" content="Vote in today's Daily Topic, complete the Global Topic, and review your past responses on One World." />
        <link rel="canonical" href="https://one-world.lovable.app/" />
        <meta property="og:title" content="Your Topics — One World Dashboard" />
        <meta property="og:description" content="Vote in today's Daily Topic and complete the Global Topic." />
        <meta property="og:url" content="https://one-world.lovable.app/" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 pb-28 sm:pb-32">
        <h1 className="sr-only">Global Topics Dashboard</h1>

        <Tabs defaultValue="today" className="w-full">

          <TabsContent value="today" className="mt-0">
            <FlipCard
              frontLabel="Global"
              backLabel="Daily"
              front={<WeeklyChallenge onUnlocked={setWeeklyUnlocked} />}
              back={weeklyUnlocked ? <DailyPoll /> : <DailyLocked />}
            />
          </TabsContent>


          <TabsContent value="responses" className="mt-0">
            <MyResponses />
          </TabsContent>

          <TabsContent value="submit" className="mt-0">
            <Tabs defaultValue="topic" className="w-full max-w-2xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="topic">Suggest Topic</TabsTrigger>
                <TabsTrigger value="feedback">Send Feedback</TabsTrigger>
              </TabsList>
              <TabsContent value="topic" className="mt-0">
                <SubmitQuestion />
              </TabsContent>
              <TabsContent value="feedback" className="mt-0">
                <FeedbackForm />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            <TabsList className="w-full h-16 sm:h-18 bg-transparent flex justify-around items-center px-2 sm:px-4 max-w-md mx-auto rounded-none border-0 gap-1">
              <TabsTrigger
                value="today"
                className="flex flex-col items-center justify-center gap-1 h-14 w-20 sm:w-24 rounded-xl border-0 bg-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground transition-all duration-200"
              >
                <Vote className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium leading-none">Today</span>
              </TabsTrigger>
              <TabsTrigger
                value="responses"
                className="flex flex-col items-center justify-center gap-1 h-14 w-20 sm:w-24 rounded-xl border-0 bg-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground transition-all duration-200"
              >
                <History className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium leading-none">Previous</span>
              </TabsTrigger>
              <TabsTrigger
                value="submit"
                className="flex flex-col items-center justify-center gap-1 h-14 w-20 sm:w-24 rounded-xl border-0 bg-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground transition-all duration-200"
              >
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium leading-none">Submit</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
