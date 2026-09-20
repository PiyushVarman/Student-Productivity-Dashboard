"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { CircleCheckBig, Files, NotebookPen, Timer, Trophy, User, Moon, Sun, Palette, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogTitle, DialogHeader, DialogDescription, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AudioPlayer } from "./musicplayer.js";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel.jsx";
import PomodoroTimer from "@/components/ui/PomodoroTimer.jsx";

const WALLPAPERS = [
  { id: "yourname", src: "/wallpapers/yourname.jpg", title: "Your Name", theme: "dark" },
  { id: "icons", src: "/wallpapers/icons.png", title: "Icons", theme: "dark" },
  { id: "pastel", src: "/wallpapers/pastel.png", title: "Pastel", theme: "light" },
  { id: "BND", src: "/wallpapers/brandnewday.webp", title: "Brand New Day", theme: "dark" },
];

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");

  // To-Do List state
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    // 1. Theme initialization: Read saved theme, fallback to system/dark default
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Wallpaper initialization
    const savedBg = localStorage.getItem("selected_wallpaper");
    if (savedBg) {
      setBackgroundImage(savedBg);
    }

    const savedTasks = localStorage.getItem("study_buddy_tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
  }, []);

  const handleSelectWallpaper = (wallpaper) => {
    setBackgroundImage(wallpaper.src);
    localStorage.setItem("selected_wallpaper", wallpaper.src);

    const shouldBeDark = wallpaper.theme === "dark";
    setIsDarkMode(shouldBeDark);
    localStorage.setItem("theme", wallpaper.theme);

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const clearWallpaper = () => {
    setBackgroundImage("");
    localStorage.removeItem("selected_wallpaper");
  };

  const toggleTheme = () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);

    if (nextState) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem("study_buddy_tasks", JSON.stringify(updated));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: crypto.randomUUID(),
      title: newTaskText.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    saveTasks([newTask, ...tasks]);
    setNewTaskText("");
  };

  const handleToggleTask = (taskId) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    saveTasks(updated);
  };

  const handleDeleteTask = (taskId) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
  };

  return (
    <div
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
      className={`flex flex-col flex-1 min-h-screen items-center justify-start font-sans transition-all duration-300 ${
        backgroundImage
          ? "bg-cover bg-center bg-no-repeat bg-fixed"
          : "bg-gray-200 dark:bg-black/50"
      }`}
    >
      <div className="w-[99vw] flex flex-row items-center justify-start">
        <div className="text-black my-5 mr-[75vw] pl-[1vw] text-left dark:text-shadow-sm/50 dark:text-white leading-10 text-5xl py-2 font-['Playwrite_NZ_Basic_Guides'] rounded-xl">
          Study Buddy
        </div>
        <Dialog>
          <Tooltip>
            <DialogTrigger render={<TooltipTrigger render={<Button className="rounded-3xl bg-white w-[2vw] h-[2vw] p-5 text-3xl text-center">🧑</Button>}/>}/>
            <TooltipContent>User</TooltipContent>
          </Tooltip>
          <DialogContent className="h-max min-h-90 w-[90vw] !max-w-none">
            <Tabs defaultValue="userset" className="flex items-center">
              <TabsList className="flex gap-x-3">
                <TabsTrigger value="userset"><User/>User Settings</TabsTrigger>
                <TabsTrigger value="rewards"><Trophy/>Rewards</TabsTrigger>
                <TabsTrigger value="personalization"><Palette/>Personalization</TabsTrigger>
              </TabsList>
              
              <TabsContent value="userset" className="p-10">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
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
                  <Field className="flex flex-row items-center pt-4">
                    <div className="space-y-0.5">
                      <Label>Theme Preference</Label>
                      <p className="text-xs text-muted-foreground">
                        Switch between light and dark mode appearance
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="!w-30 flex items-center gap-2 cursor-pointer"
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

              <TabsContent value="personalization" className="flex flex-col items-start pb-10">
                <div className="flex items-center justify-between w-[70vw] my-5">
                  <div className="space-y-0.5">
                    <Label>Background Theme</Label>
                    <p className="text-xs text-muted-foreground">
                      Pick your background theme
                    </p>
                  </div>
                  {backgroundImage && (
                    <Button variant="outline" size="sm" onClick={clearWallpaper}>
                      Reset to Default
                    </Button>
                  )}
                </div>

                <Carousel className="w-[70vw]">
                  <CarouselContent className="*:select-none">
                    {WALLPAPERS.map((wp) => (
                      <CarouselItem key={wp.id} className="w-[10vw]! basis-1/3">
                        <div
                          onClick={() => handleSelectWallpaper(wp)}
                          className={`cursor-pointer overflow-hidden rounded-xl border-2 transition-all p-1 ${
                            backgroundImage === wp.src
                              ? "border-primary ring-primary shadow-lg"
                              : "border-transparent hover:border-muted-foreground/50"
                          }`}
                        >
                          <img
                            src={wp.src}
                            alt={wp.title}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <p className="text-xs font-medium text-center mt-2">{wp.title}</p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Apps */}
      <div className="mt-2 w-[99vw] h-[84vh] items-start *:dark:text-black flex flex-row gap-x-5 *:duration-500">
        <Card className="w-[25vw] shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md h-full p-5 rounded-2xl">
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

        <div className="dark:bg-zinc-900/90 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative bg-white/90 backdrop-blur-md h-full overflow-clip">
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

        <div className="rounded-2xl w-[25vw] flex flex-col">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md h-[55vh] rounded-2xl shadow-2xl">
            <Tabs defaultValue="todo" className="rounded-2xl p-5 h-full flex flex-col">
              <TabsList>
                <TabsTrigger value="todo"><CircleCheckBig/>To-Do</TabsTrigger>
                <TabsTrigger value="docs"><Files/>Documents</TabsTrigger>
              </TabsList>
              
              {/* Integrated To-Do List Area */}
              <TabsContent value="todo" className="flex-1 flex flex-col min-h-0 pt-3 space-y-3">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <Input
                    placeholder="What are you working on?"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="h-9 text-xs text-foreground dark:bg-zinc-800/80 dark:border-zinc-700 border-black/50"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <div className="flex items-center justify-between text-sm text-foreground  px-1 ">
                  <span>
                    {tasks.filter((t) => t.completed).length}/{tasks.length} completed
                  </span>
                </div>

                <ScrollArea className="flex-1 pr-2">
                  {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm border text-foreground border-dashed rounded-lg">
                      All Done!
                    </div>
                  ) : (
                    <div className="space-y-1.5 pb-2 *:shadow-xs">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="group flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/40 transition-colors"
                        >
                          <div
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleToggleTask(task.id)}
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleTask(task.id)} className="border-foreground/50"
                            />
                            <span
                              className={`text-sm truncate transition-all ${
                                task.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground font-medium"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="docs">
                <div className="text-black dark:text-white pt-2">
                  Documents.
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="h-[26.5vh] shadow-2xl backdrop-blur-md rounded-2xl mt-5">
            <AudioPlayer/>
          </div>
        </div>
      </div>
    </div>
  );
}