import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DailyPoll } from "@/components/DailyPoll";
import { MyResponses } from "@/components/MyResponses";
import { SubmitQuestion } from "@/components/SubmitQuestion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="today" className="text-xs sm:text-sm px-2 sm:px-4">
              🗳️ <span className="hidden sm:inline">Today's </span>Challenge
            </TabsTrigger>
            <TabsTrigger value="responses" className="text-xs sm:text-sm px-2 sm:px-4">
              📋 <span className="hidden sm:inline">My </span>Responses
            </TabsTrigger>
            <TabsTrigger value="submit" className="text-xs sm:text-sm px-2 sm:px-4">
              💡 Submit<span className="hidden sm:inline"> Question</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <DailyPoll />
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
