import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DailyPoll } from "@/components/DailyPoll";
import { MyResponses } from "@/components/MyResponses";
import { SubmitQuestion } from "@/components/SubmitQuestion";
import { WeeklyChallenge, DailyLocked } from "@/components/WeeklyChallenge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Index = () => {
  const [weeklyUnlocked, setWeeklyUnlocked] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <WeeklyChallenge onUnlocked={setWeeklyUnlocked} />

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto">
            <TabsTrigger value="today" className="text-xs sm:text-sm flex-1 sm:flex-none">
              🗳️ Today's Challenge
            </TabsTrigger>
            <TabsTrigger value="responses" className="text-xs sm:text-sm flex-1 sm:flex-none">
              📋 My Responses
            </TabsTrigger>
            <TabsTrigger value="submit" className="text-xs sm:text-sm flex-1 sm:flex-none">
              💡 Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {weeklyUnlocked ? <DailyPoll /> : <DailyLocked />}
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
