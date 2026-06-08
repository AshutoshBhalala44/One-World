import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { DailyPoll } from "@/components/DailyPoll";
import { MyResponses } from "@/components/MyResponses";
import { SubmitQuestion } from "@/components/SubmitQuestion";
import { WeeklyChallenge, DailyLocked } from "@/components/WeeklyChallenge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Vote, History, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const [weeklyUnlocked, setWeeklyUnlocked] = useState<boolean | null>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const weeklyRef = useRef<HTMLDivElement>(null);
  const dailyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the active question once weekly state is known
  useEffect(() => {
    if (initialScrollDone) return;
    if (weeklyUnlocked === null) return; // wait until fetch completes

    const timer = setTimeout(() => {
      if (!weeklyUnlocked && weeklyRef.current) {
        weeklyRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        setInitialScrollDone(true);
      } else if (weeklyUnlocked && dailyRef.current) {
        dailyRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        setInitialScrollDone(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [weeklyUnlocked, initialScrollDone]);

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
        <WeeklyChallenge onUnlocked={setWeeklyUnlocked} scrollRef={weeklyRef} />

        <Tabs
          defaultValue="today"
          className="w-full"
          onValueChange={(val) => {
            if (val === "today" && dailyRef.current) {
              setTimeout(() => {
                dailyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 50);
            }
          }}
        >
          <TabsContent value="today" className="mt-0">
            {weeklyUnlocked ? <DailyPoll scrollRef={dailyRef} /> : <DailyLocked />}
          </TabsContent>

          <TabsContent value="responses" className="mt-0">
            <MyResponses />
          </TabsContent>

          <TabsContent value="submit" className="mt-0">
            <SubmitQuestion />
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
