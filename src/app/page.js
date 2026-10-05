"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { CircleCheckBig, Files, NotebookPen, Timer, Trophy, User, Moon, Sun, Palette, Plus, Trash2, SendHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import {
  formatBytes,
  useFileUpload,
} from "@/hooks/use-file-upload";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CircleAlertIcon, FileArchiveIcon, FileSpreadsheetIcon, FileTextIcon, HeadphonesIcon, ImageIcon, RefreshCwIcon, UploadIcon, VideoIcon, XIcon } from 'lucide-react';

const WALLPAPERS = [
  { id: "yourname", src: "/wallpapers/yourname.jpg", title: "Your Name", theme: "dark" },
  { id: "icons", src: "/wallpapers/icons.png", title: "Icons", theme: "dark" },
  { id: "pastel", src: "/wallpapers/pastel.png", title: "Pastel", theme: "light" },
  { id: "BND", src: "/wallpapers/brandnewday.webp", title: "Brand New Day", theme: "dark" },
];

export default function Home() {
  // File upload configuration defaults
  const maxFiles = 5;
  const maxSize = 10 * 1024 * 1024; // 10MB
  const accept = "*";
  const multiple = true;
  const simulateUpload = true;

  const defaultImages = [
    {
      id: "default-3",
      name: "image-1.png",
      size: 42048,
      type: "image/png",
      url: "https://picsum.photos/1000/800?grayscale&random=10",
    },
    {
      id: "default-4",
      name: "image-2.png",
      size: 62807,
      type: "image/png",
      url: "https://picsum.photos/1000/800?grayscale&random=11",
    },
  ];

  const defaultUploadFiles = defaultImages.map((image) => ({
    id: image.id,
    file: {
      name: image.name,
      size: image.size,
      type: image.type,
    },
    preview: image.url,
    progress: 100,
    status: "completed",
  }));

  const [uploadFiles, setUploadFiles] = useState(defaultUploadFiles);

  const {
    isDragging,
    errors,
    removeFile,
    clearFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    getInputProps,
  } = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles: defaultImages,
    onFilesChange: (newFiles) => {
      const newUploadFiles = newFiles.map((file) => {
        const existingFile = uploadFiles.find((existing) => existing.id === file.id);
        if (existingFile) {
          return { ...existingFile, ...file };
        } else {
          return { ...file, progress: 0, status: "uploading" };
        }
      });
      setUploadFiles(newUploadFiles);
    },
  });

  // Simulate upload progress
  useEffect(() => {
    if (!simulateUpload) return;

    const interval = setInterval(() => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.status !== "uploading") return file;

          const increment = Math.random() * 15 + 5;
          const newProgress = Math.min(file.progress + increment, 100);

          if (newProgress > 50 && Math.random() < 0.1) {
            return {
              ...file,
              status: "error",
              error: "Upload failed. Please try again.",
            };
          }

          if (newProgress >= 100) {
            return {
              ...file,
              progress: 100,
              status: "completed",
            };
          }

          return {
            ...file,
            progress: newProgress,
          };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [simulateUpload]);

  const retryUpload = (fileId) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              progress: 0,
              status: "uploading",
              error: undefined,
            }
          : file
      )
    );
  };

  const removeUploadFile = (fileId) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    removeFile(fileId);
  };

  const getFileIcon = (file) => {
    const type = file.type || "";
    if (type.startsWith("image/")) return <ImageIcon className="size-4" />;
    if (type.startsWith("video/")) return <VideoIcon className="size-4" />;
    if (type.startsWith("audio/")) return <HeadphonesIcon className="size-4" />;
    if (type.includes("pdf")) return <FileTextIcon className="size-4" />;
    if (type.includes("word") || type.includes("doc")) return <FileTextIcon className="size-4" />;
    if (type.includes("excel") || type.includes("sheet")) return <FileSpreadsheetIcon className="size-4" />;
    if (type.includes("zip") || type.includes("rar")) return <FileArchiveIcon className="size-4" />;
    return <FileTextIcon className="size-4" />;
  };

  const completedCount = uploadFiles.filter((f) => f.status === "completed").length;
  const errorCount = uploadFiles.filter((f) => f.status === "error").length;
  const uploadingCount = uploadFiles.filter((f) => f.status === "uploading").length;

  // Journal state
  const [journalText, setJournalText] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const savedJournals = localStorage.getItem("study_buddy_journals");
    if (savedJournals) {
      try {
        setJournalEntries(JSON.parse(savedJournals));
      } catch (e) {
        console.error("Failed to parse journals", e);
      }
    }

    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 10000);

    return () => clearInterval(timer);
  }, []);

  const handleSaveJournal = (e) => {
    e.preventDefault();
    if (!journalText.trim()) return;

    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: currentDateTime,
      text: journalText.trim(),
    };

    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem("study_buddy_journals", JSON.stringify(updated));
    setJournalText("");
  };

  const handleDeleteJournal = (id) => {
    const updated = journalEntries.filter((entry) => entry.id !== id);
    setJournalEntries(updated);
    localStorage.setItem("study_buddy_journals", JSON.stringify(updated));
  };

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you study today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: "assistant", content: data.error || "Something went wrong." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, { role: "assistant", content: "Failed to connect to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");

  // To-Do List state
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

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
        <Card className="w-[25vw] shadow-2xl bg-white/90 dark:bg-zinc-900/90 outline backdrop-blur-md h-full p-5 rounded-2xl">
          <Tabs defaultValue="focus">
            <TabsList>
              <TabsTrigger value="focus"><Timer/>Focus</TabsTrigger>
              <TabsTrigger value="journal"><NotebookPen/>Journal</TabsTrigger>
            </TabsList>
            <TabsContent value="focus">
              <div className="flex grow bg-gray-300 shadow-md hover:scale-101 duration-200 animate-out rounded-xl h-full items-center justify-center">
                <PomodoroTimer/>
              </div>
            </TabsContent>
            <TabsContent value="journal" className="h-full! pt-2">
              <div className="flex flex-col bg-gray-100 dark:bg-zinc-800/90 rounded-xl p-4 shadow h-125 justify-between">
                
                {/* Top Row: Title & View Past Entries Dialog Button */}
                <div className="flex items-center justify-between pb-2">
                  <span className="text-sm font-semibold text-foreground">Daily Journal</span>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs dark:text-white">
                        Past Entries ({journalEntries.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[80vw] max-w-lg max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Journal History</DialogTitle>
                        <DialogDescription>
                          {journalEntries.length === 0
                            ? "You are yet to write a Journal Entry."
                            : journalEntries.length === 1
                            ? "You've journalled 1 time"
                            : `You've journalled ${journalEntries.length} times.`}
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="flex-1 max-h-[50vh] pr-4 my-2">
                        {journalEntries.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No journal entries yet. Start logging your thoughts!
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {journalEntries.map((entry) => (
                              <div
                                key={entry.id}
                                className="p-3 rounded-lg border bg-background/50 flex flex-col gap-1 relative group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {entry.timestamp}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteJournal(entry.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <p className="text-sm whitespace-pre-wrap text-foreground">{entry.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" size="sm">Close</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Date and Time Display */}
                <div className="text-xs font-medium text-muted-foreground pb-2">
                  {currentDateTime || "Loading date & time..."}
                </div>

                {/* Textarea & Log Button Form */}
                <form onSubmit={handleSaveJournal} className="flex flex-col flex-1 gap-2">
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="What's on your mind today?"
                    className="flex-1 w-full bg-background/60 border border-border/60 rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="sm" className="w-full">
                    Log
                  </Button>
                </form>

              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="dark:bg-zinc-900/90 w-[60%] rounded-2xl shadow-2xl flex flex-col items-center justify-between relative bg-white/90 backdrop-blur-md h-full">
          {/* Chat Messages Area */}
          <ScrollArea className="w-[90%] flex flex-col h-[80%] rounded px-2">
            <ScrollBar/>
            <div className="flex flex-col space-y-4 py-4">
              {messages.map((msg, index) => (
                <Bubble
                  key={index}
                  variant={msg.role === "user" ? "muted" : "default"}
                  align={msg.role === "user" ? "end" : "start"}
                  className={`text-xl ${msg.role === "user" ? "ml-30 text-right" : "mr-30 text-left text-gray-900 dark:text-white"}`}
                >
                  <BubbleContent>{msg.content}</BubbleContent>
                </Bubble>
              ))}
              {isLoading && (
                <Bubble className="text-xl mr-30 text-left text-muted-foreground animate-pulse">
                  <BubbleContent className="animate-bounce">Thinking...</BubbleContent>
                </Bubble>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input Area */}
          <form onSubmit={handleSendMessage} className="w-[95%] flex items-center gap-2 mb-5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="bg-black/50 w-full backdrop-blur-xs shadow-xl py-4 rounded-3xl focus:bg-black duration-200 px-6 text-white resize-none outline-none min-h-[50px] max-h-[120px]"
              placeholder="What would you like to know?"
            />
            <Button type="submit" disabled={isLoading} className="rounded-full h-12 w-12 shrink-0">
              <SendHorizontal/>
            </Button>
          </form>
        </div>

        <div className="rounded-2xl w-[25vw] flex flex-col">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md h-[55vh] w-[25vw] rounded-2xl shadow-2xl overflow-hidden">
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

                <div className="flex items-center justify-between text-sm text-foreground px-1">
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

              <TabsContent value="docs" className="flex-1 flex flex-col min-h-0 pt-2 overflow-hidden">
                <div className="text-black dark:text-white flex flex-col h-full overflow-hidden">
                  <div className="w-full max-w-2xl flex flex-col h-full overflow-hidden">
                    {/* Upload Area */}
                    <div
                      className={cn(
                        "rounded-lg relative border flex flex-row justify-center border-dashed p-4 text-center shrink-0 transition-colors",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      )}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input {...getInputProps()} className="sr-only" />

                      <div className="flex flex-row items-center gap-4">
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-full",
                            isDragging ? "bg-primary/10" : "bg-none"
                          )}
                        >
                          <UploadIcon
                            className={cn(
                              "",
                              isDragging ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-md font-semibold">Upload your files</p>
                        </div>

                        <Button onClick={openFileDialog}>
                          <UploadIcon className="h-4 w-4 " />
                          Select
                        </Button>
                      </div>
                    </div>

                    {/* Upload Stats */}
                    {uploadFiles.length > 0 && (
                      <div className="mt-6 flex items-center justify-between ">
                        <div className="flex items-center gap-1 ">
                          <h4 className="text-sm font-medium">Files</h4>
                          <div className="flex items-center justify-center gap-1">
                            {completedCount > 0 && (
                              <Badge size="sm" variant="success-light">
                                Completed: {completedCount}
                              </Badge>
                            )}
                            {errorCount > 0 && (
                              <Badge size="sm" variant="destructive">
                                Failed: {errorCount}
                              </Badge>
                            )}
                            {uploadingCount > 0 && (
                              <Badge size="sm" variant="secondary">
                                Uploading: {uploadingCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button onClick={clearFiles} variant="outline" size="xs">
                          Clear all
                        </Button>
                      </div>
                    )}

                    {/* File List */}
                    {uploadFiles.length > 0 && (
                      <ScrollArea className="flex-1 mt-3 pr-3 overflow-y-auto">
                        {uploadFiles.map((fileItem) => (
                          <div
                            key={fileItem.id}
                            className="border-border overflow-auto my-2 bg-card rounded-lg border p-2.5"
                          >
                            <div className="flex items-start gap-2.5">
                              {/* File Icon */}
                              <div className="shrink-0">
                                {fileItem.preview &&
                                fileItem.file.type.startsWith("image/") ? (
                                  <img
                                    src={fileItem.preview}
                                    alt={fileItem.file.name}
                                    className="rounded-lg h-12 w-12 border object-cover"
                                  />
                                ) : (
                                  <div className="border-border text-muted-foreground rounded-lg flex h-12 w-12 items-center justify-center border">
                                    {getFileIcon(fileItem.file)}
                                  </div>
                                )}
                              </div>

                              {/* File Info */}
                              <div className="min-w-0 flex-1 ">
                                <div className="mt-0.75 flex items-center justify-between">
                                  <p className="inline-flex flex-col justify-center gap-1 truncate font-medium">
                                    <span className="text-sm">{fileItem.file.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {formatBytes(fileItem.file.size)}
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {/* Remove Button */}
                                    <Button
                                      onClick={() => removeUploadFile(fileItem.id)}
                                      variant="ghost"
                                      size="icon"
                                      className="text-muted-foreground size-6 hover:bg-transparent hover:opacity-100"
                                    >
                                      <XIcon className="size-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                {fileItem.status === "uploading" && (
                                  <div className="mt-2">
                                    <Progress value={fileItem.progress} className="h-1" />
                                  </div>
                                )}

                                {/* Error Message */}
                                {fileItem.status === "error" && fileItem.error && (
                                  <Alert variant="destructive" className="mt-2 px-2 py-1">
                                    <CircleAlertIcon className="size-4" />
                                    <AlertTitle className="text-xs">
                                      {fileItem.error}
                                    </AlertTitle>
                                    <AlertAction>
                                      <Button
                                        onClick={() => retryUpload(fileItem.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground size-6 hover:bg-transparent hover:opacity-100"
                                      >
                                        <RefreshCwIcon className="size-3.5" />
                                      </Button>
                                    </AlertAction>
                                  </Alert>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    )}

                    {/* Error Messages */}
                    {errors.length > 0 && (
                      <Alert variant="destructive" className="mt-5">
                        <CircleAlertIcon />
                        <AlertTitle>File upload error(s)</AlertTitle>
                        <AlertDescription>
                          {errors.map((error, index) => (
                            <p key={index} className="last:mb-0">
                              {error}
                            </p>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
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