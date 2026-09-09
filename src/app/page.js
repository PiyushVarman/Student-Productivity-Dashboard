"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { CircleCheckBig, Files, NotebookPen, Timer, Trophy, User, Moon, Sun } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogTitle, DialogHeader, DialogDescription, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AudioPlayer } from "./musicplayer.js";
import PomodoroTimer from "@/components/ui/PomodoroTimer.jsx";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);
    if (nextState) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-start font-sans bg-gray-200 dark:bg-black/50"> {/*bg-[#faf9f6]*/} 
      <div className=" w-[99vw] flex flex-row items-center justify-start ">
        <div className=" text-black my-5 mr-[75vw] pl-[1vw] text-left dark:text-shadow-sm/50 dark:text-shadow-white leading-10 text-5xl py-2 font-['Playwrite_NZ_Basic_Guides']">Study Buddy </div>
        <Dialog className="">
          <Tooltip>
            <DialogTrigger render={<TooltipTrigger render={<Button className="rounded-3xl bg-white w-[2vw] h-[2vw] p-5 text-3xl text-center">🧑</Button>}/>}/>
            
            <TooltipContent>User</TooltipContent>
          </Tooltip>
          <DialogContent className="h-max min-h-90 w-[90vw] max-w-none! ">
          <Tabs defaultValue="userstats" className="flex items-center">
            <TabsList>
              <TabsTrigger value="userstats"><User/>User Statistics</TabsTrigger>
              <TabsTrigger value="rewards"><Trophy/>Rewards</TabsTrigger>
            </TabsList>
            <TabsContent value="userstats" className="w-max p-10">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup className="py-10">
                <Field>
                  <Label htmlFor="name-1">Name</Label>
                  <Input id="name-1" name="name" defaultValue="Firstname Lastname" />
                </Field>
                <Field>
                  <Label htmlFor="username-1">Username</Label>
                  <Input id="username-1" name="username" defaultValue="@hello" />
                </Field>
                <Field className="flex flex-row items-center  pt-4">
                  <div className="space-y-0.5">
                    <Label>Theme Preference</Label>
                    <p className="text-xs text-muted-foreground">
                      Switch between light and dark mode appearance
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-30! flex items-center gap-2 cursor-pointer"
                    onClick={toggleTheme}
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="h-4 w-4" /> Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" /> Dark Mode
                      </>
                    )}
                  </Button>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
        </Dialog>
      </div>
      {/* Apps */}
      <div className="mt-2  w-[99vw] h-[84vh] items-start *:dark:text-black  flex flex-row gap-x-5 *:duration-500">
        <Card className="w-[25vw] shadow-2xl bg-white dark:bg-zinc-900 h-full p-5 rounded-2xl">
          <Tabs>
            <TabsList defaultValue="focus">
              <TabsTrigger value="focus"><Timer/>Focus</TabsTrigger>
              <TabsTrigger value="journal"><NotebookPen/>Journal</TabsTrigger>
            </TabsList>
            <TabsContent value="focus">
              <div className="flex grow bg-gray-300 shadow-md hover:scale-101 duration-200 animate-out rounded-xl h-full items-center justify-center">
                <PomodoroTimer/>
              </div>
            </TabsContent>
            <TabsContent value="journal">
              <div className="flex grow bg-gray-300 dark:bg-zinc-800 dark:text-white shadow-md hover:scale-101 duration-200 animate-out rounded-xl py-[35vh] items-center justify-center">
                Journal
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        <div className="dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative bg-white h-full">
          <ScrollArea className="w-[50vw] flex flex-col h-[95vh] overflow-hidden">
            <Bubble className="text-xl mt-5 ml-5 text-gray-900 ">
              <BubbleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </BubbleContent>
            </Bubble>
            <Bubble variant="muted" align="end" className="text-xl mt-10 ml-30 text-right">
              <BubbleContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </BubbleContent>
            </Bubble>
            <Bubble className="text-xl mt-10 ml-5 text-gray-900 ">
              <BubbleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </BubbleContent>
            </Bubble>
            <Bubble variant="muted" align="end" className="text-xl mt-10 ml-30 text-right">
              <BubbleContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </BubbleContent>
            </Bubble>
            <Bubble className="text-xl mt-10 ml-5 text-gray-900 ">
              <BubbleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </BubbleContent>
            </Bubble>
          </ScrollArea>
          <textarea className="bg-black/50 w-[95%] relative bottom-5 backdrop-blur-xs shadow-xl py-5 rounded-3xl focus:bg-black duration-200 px-10 text-white resize-none" placeholder="What would you like to know?"></textarea>
        </div>
        <div className="rounded-2xl w-[25vw] flex flex-col ">
          <div className="bg-white dark:bg-zinc-900 h-[55vh] rounded-2xl shadow-2xl">
            <Tabs defaultValue="todo" className="rounded-2xl p-5">
              <TabsList>
                <TabsTrigger value="todo"><CircleCheckBig/>To-Do</TabsTrigger>
                <TabsTrigger value="docs"><Files/>Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="todo">
                <ScrollArea>
                  <div className="text-black dark:text-white">
                    To-Do List.
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="docs">
                <div className="text-black dark:text-white">
                  Documents.
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="h-[26.5vh] shadow-2xl bg-white rounded-2xl mt-5 ">
            {/* Local Music Playback */}
            <AudioPlayer/>
          </div>
        </div>
      </div>
    </div>
  );
}