import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { DailyPoll } from "@/components/DailyPoll";
import { MyResponses } from "@/components/MyResponses";
import { SubmitQuestion } from "@/components/SubmitQuestion";
import { WeeklyChallenge, DailyLocked } from "@/components/WeeklyChallenge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Index = () => {
  const [weeklyUnlocked, setWeeklyUnlocked] = useState<boolean | null>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
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

      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <h1 className="sr-only">Global Topics Dashboard</h1>
        <WeeklyChallenge onUnlocked={setWeeklyUnlocked} scrollRef={weeklyRef} />

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto">
            <TabsTrigger value="today" className="text-xs sm:text-sm flex-1 sm:flex-none">
              🗳️ Today's Topic
            </TabsTrigger>
            <TabsTrigger value="responses" className="text-xs sm:text-sm flex-1 sm:flex-none">
              📋 My Responses
            </TabsTrigger>
            <TabsTrigger value="submit" className="text-xs sm:text-sm flex-1 sm:flex-none">
              💡 Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {weeklyUnlocked ? <DailyPoll scrollRef={dailyRef} /> : <DailyLocked />}
          </TabsContent>

          <TabsContent value="responses">
            <MyResponses />
          </TabsContent>

          <TabsContent value="submit">
            <SubmitQuestion />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-8 mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>One World — Transparent global polling. Every voice matters.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
