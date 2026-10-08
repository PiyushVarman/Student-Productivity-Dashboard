"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getRequiredXpForLevel, calculateXpChange } from "@/lib/xp";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import ReactMarkdown from "react-markdown";
import { CircleCheckBig, Files, NotebookPen, Timer, Trophy, User, Moon, Sun, Palette, Plus, Trash2, SendHorizontal, LogOut, Download, CheckCircle2, Loader2, CircleAlertIcon, FileArchiveIcon, FileSpreadsheetIcon, FileTextIcon, HeadphonesIcon, ImageIcon, RefreshCwIcon, UploadIcon, VideoIcon, XIcon } from "lucide-react";
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
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Firebase imports
import { auth, db, storage, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

const WALLPAPERS = [
  { id: "yourname", src: "/wallpapers/yourname.jpg", title: "Your Name", theme: "dark" },
  { id: "icons", src: "/wallpapers/icons.png", title: "Icons", theme: "dark" },
  { id: "pastel", src: "/wallpapers/pastel.png", title: "Pastel", theme: "light" },
  { id: "BND", src: "/wallpapers/brandnewday.webp", title: "Brand New Day", theme: "dark" },
];

export default function Home() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Profile State
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Appearance & Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");

  // Journal State
  const [journalText, setJournalText] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // AI Chat State
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you study today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearChatDialogOpen, setIsClearChatDialogOpen] = useState(false);

  // To-Do List State
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");

  // Documents / File Upload State
  const maxFiles = 5;
  const maxSize = 10 * 1024 * 1024; // 10MB
  const accept = "*";
  const multiple = true;

  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingQueue, setUploadingQueue] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [isClearAllDocsDialogOpen, setIsClearAllDocsDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // XP & Progression State
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);
  const userLevelRef = useRef(1);
  const userXpRef = useRef(0);
  const [levelUpNotification, setLevelUpNotification] = useState(null);
  const levelUpTimeoutRef = useRef(null);

  // 1. Monitor Authentication State
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const loadedName = data.name || user.displayName || user.email?.split("@")[0] || "Student";
            const loadedUsername = data.username || "@" + (user.email?.split("@")[0] || "student");
            setProfileName(loadedName);
            setProfileUsername(loadedUsername);

            const loadedLevel = data.level !== undefined ? Number(data.level) : 1;
            const loadedXp = data.xp !== undefined ? Number(data.xp) : 0;
            setUserLevel(loadedLevel);
            setUserXp(loadedXp);
            userLevelRef.current = loadedLevel;
            userXpRef.current = loadedXp;

            if (data.theme) {
              const shouldBeDark = data.theme === "dark";
              setIsDarkMode(shouldBeDark);
              if (shouldBeDark) {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
            }

            if (data.backgroundImage !== undefined) {
              setBackgroundImage(data.backgroundImage || "");
            }
          } else {
            const defaultName = user.displayName || user.email?.split("@")[0] || "Student";
            const defaultUsername = "@" + (user.email?.split("@")[0] || "student");
            setProfileName(defaultName);
            setProfileUsername(defaultUsername);
            setUserLevel(1);
            setUserXp(0);
            userLevelRef.current = 1;
            userXpRef.current = 0;

            await setDoc(
              userRef,
              {
                name: defaultName,
                username: defaultUsername,
                email: user.email,
                theme: isDarkMode ? "dark" : "light",
                backgroundImage: backgroundImage || "",
                level: 1,
                xp: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Real-time Listeners for User's Isolated Data (Firestore)
  useEffect(() => {
    if (!currentUser || !db) return;

    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.level !== undefined) {
          const lvl = Number(data.level);
          setUserLevel(lvl);
          userLevelRef.current = lvl;
        }
        if (data.xp !== undefined) {
          const xpVal = Number(data.xp);
          setUserXp(xpVal);
          userXpRef.current = xpVal;
        }
      }
    });

    const journalsQuery = query(collection(db, "users", currentUser.uid, "journalEntries"), orderBy("createdAt", "desc"));
    const unsubJournals = onSnapshot(journalsQuery, (snapshot) => {
      const entries = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setJournalEntries(entries);
    });

    const chatsQuery = query(collection(db, "users", currentUser.uid, "chats"), orderBy("createdAt", "asc"));
    const unsubChats = onSnapshot(chatsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const msgs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setMessages(msgs);
      } else {
        setMessages([{ role: "assistant", content: "Hello! How can I help you study today?" }]);
      }
    });

    const tasksQuery = query(collection(db, "users", currentUser.uid, "todos"), orderBy("createdAt", "desc"));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setTasks(items);
    });

    const docsQuery = query(collection(db, "users", currentUser.uid, "documents"), orderBy("createdAt", "desc"));
    const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
      const docItems = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setUploadedDocs(docItems);
    });

    return () => {
      unsubUser();
      unsubJournals();
      unsubChats();
      unsubTasks();
      unsubDocs();
    };
  }, [currentUser]);

  // Trigger Level Up Toast Notification
  const triggerLevelUpToast = useCallback((newLevel) => {
    if (levelUpTimeoutRef.current) {
      clearTimeout(levelUpTimeoutRef.current);
    }
    setLevelUpNotification(newLevel);
    levelUpTimeoutRef.current = setTimeout(() => {
      setLevelUpNotification(null);
    }, 4500);
  }, []);

  // Apply XP Change (positive or negative)
  const applyXpChange = useCallback(
    async (amount) => {
      if (!currentUser || !db) return;

      const currentLvl = userLevelRef.current;
      const currentExp = userXpRef.current;
      const { level: newLevel, xp: newXp, leveledUp } = calculateXpChange(currentLvl, currentExp, amount);

      userLevelRef.current = newLevel;
      userXpRef.current = newXp;
      setUserLevel(newLevel);
      setUserXp(newXp);

      if (leveledUp) {
        triggerLevelUpToast(newLevel);
      }

      try {
        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            level: newLevel,
            xp: newXp,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to update XP in Firestore:", err);
      }
    },
    [currentUser, triggerLevelUpToast]
  );

  // Focus Session Complete Handler (1.5 XP per minute on 00:00 completion)
  const handleFocusSessionComplete = useCallback(
    (minutes) => {
      const xpAwarded = Math.round(Number(minutes) * 1.5 * 10) / 10;
      if (xpAwarded > 0) {
        applyXpChange(xpAwarded);
      }
    },
    [applyXpChange]
  );

  // 3. Live Date & Time Clock
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
          " • " +
          now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 10000);

    return () => clearInterval(timer);
  }, []);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser || !db) return;

    setIsSavingProfile(true);
    setProfileSaveStatus("");

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: profileName.trim(),
        username: profileUsername.trim(),
        updatedAt: serverTimestamp(),
      });
      setProfileSaveStatus("Changes saved successfully!");
      setTimeout(() => setProfileSaveStatus(""), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setProfileSaveStatus("Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleTheme = async () => {
    const nextState = !isDarkMode;
    const nextTheme = nextState ? "dark" : "light";
    setIsDarkMode(nextState);

    if (nextState) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    if (currentUser && db) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { theme: nextTheme, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Failed to update theme in Firestore:", err);
      }
    }
  };

  const handleSelectWallpaper = async (wallpaper) => {
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

    if (currentUser && db) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { backgroundImage: wallpaper.src, theme: wallpaper.theme, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Failed to update wallpaper in Firestore:", err);
      }
    }
  };

  const clearWallpaper = async () => {
    setBackgroundImage("");
    localStorage.removeItem("selected_wallpaper");

    if (currentUser && db) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { backgroundImage: "", updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Failed to clear wallpaper in Firestore:", err);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("study_buddy_user");
      }
      router.push("/auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleSaveJournal = async (e) => {
    e.preventDefault();
    if (!journalText.trim() || !currentUser || !db) return;

    const textToSave = journalText.trim();
    setJournalText("");

    try {
      await addDoc(collection(db, "users", currentUser.uid, "journalEntries"), {
        text: textToSave,
        timestamp: currentDateTime,
        createdAt: serverTimestamp(),
      });
      applyXpChange(5);
    } catch (err) {
      console.error("Failed to save journal:", err);
      setJournalText(textToSave);
    }
  };

  const handleDeleteJournal = async (id) => {
    if (!currentUser || !db) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "journalEntries", id));
      applyXpChange(-5);
    } catch (err) {
      console.error("Failed to delete journal entry:", err);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !currentUser || !db) return;

    const userText = input.trim();
    setInput("");
    setIsLoading(true);

    // Prompting the chatbot gives +5 XP
    applyXpChange(5);

    try {
      await addDoc(collection(db, "users", currentUser.uid, "chats"), {
        role: "user",
        content: userText,
        createdAt: serverTimestamp(),
      });

      const conversationToSend = [...messages, { role: "user", content: userText }];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationToSend }),
      });

      const data = await res.json();
      const replyContent = res.ok ? data.reply : data.error || "Something went wrong.";

      await addDoc(collection(db, "users", currentUser.uid, "chats"), {
        role: "assistant",
        content: replyContent,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Chat error:", err);
      if (currentUser && db) {
        await addDoc(collection(db, "users", currentUser.uid, "chats"), {
          role: "assistant",
          content: "Failed to connect to the server.",
          createdAt: serverTimestamp(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChatHistory = async () => {
    if (!currentUser || !db) return;
    setIsClearChatDialogOpen(false);
    try {
      const snap = await getDocs(collection(db, "users", currentUser.uid, "chats"));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setMessages([{ role: "assistant", content: "Hello! How can I help you study today?" }]);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !currentUser || !db) return;

    const title = newTaskText.trim();
    setNewTaskText("");

    try {
      await addDoc(collection(db, "users", currentUser.uid, "todos"), {
        title,
        completed: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to add task:", err);
      setNewTaskText(title);
    }
  };

  const handleToggleTask = async (taskId, currentCompleted) => {
    if (!currentUser || !db) return;
    try {
      const nextCompleted = !currentCompleted;
      await updateDoc(doc(db, "users", currentUser.uid, "todos", taskId), {
        completed: nextCompleted,
      });
      // Task completion +15 XP, unchecking -15 XP
      if (nextCompleted) {
        applyXpChange(15);
      } else {
        applyXpChange(-15);
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!currentUser || !db) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "todos", taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleUploadFiles = async (incomingFiles) => {
    if (!currentUser || !storage || !db || !incomingFiles || incomingFiles.length === 0) return;

    setFileErrors([]);
    const availableSlots = maxFiles - (uploadedDocs.length + uploadingQueue.length);

    if (incomingFiles.length > availableSlots) {
      setFileErrors([`You can only store up to ${maxFiles} documents. Please delete existing documents before uploading more.`]);
      return;
    }

    for (const file of incomingFiles) {
      if (file.size > maxSize) {
        setFileErrors((prev) => [...prev, `File "${file.name}" exceeds the maximum allowed size of ${formatBytes(maxSize)}.`]);
        continue;
      }

      const queueId = crypto.randomUUID();
      const newQueueItem = {
        id: queueId,
        file: { name: file.name, size: file.size, type: file.type || "application/octet-stream" },
        progress: 0,
        status: "uploading",
        error: null,
      };

      setUploadingQueue((prev) => [newQueueItem, ...prev]);

      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `users/${currentUser.uid}/documents/${Date.now()}_${safeName}`;
        const fileRef = storageRef(storage, path);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const prog = snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
            setUploadingQueue((prev) => prev.map((item) => (item.id === queueId ? { ...item, progress: prog } : item)));
          },
          (error) => {
            console.error("Storage upload error:", error);
            setUploadingQueue((prev) => prev.map((item) => (item.id === queueId ? { ...item, status: "error", error: "Upload failed: " + error.message } : item)));
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              await addDoc(collection(db, "users", currentUser.uid, "documents"), {
                name: file.name,
                size: file.size,
                type: file.type || "application/octet-stream",
                storagePath: path,
                downloadUrl,
                createdAt: serverTimestamp(),
              });

              setUploadingQueue((prev) => prev.filter((item) => item.id !== queueId));
            } catch (metaErr) {
              console.error("Failed to save doc metadata:", metaErr);
              setUploadingQueue((prev) => prev.map((item) => (item.id === queueId ? { ...item, status: "error", error: "Failed to record document metadata in database." } : item)));
            }
          }
        );
      } catch (err) {
        console.error("Upload initiation failed:", err);
        setUploadingQueue((prev) => prev.map((item) => (item.id === queueId ? { ...item, status: "error", error: "Failed to start upload." } : item)));
      }
    }
  };

  const handleDeleteDocument = async (docItem) => {
    if (!currentUser || !db) return;
    try {
      if (docItem.storagePath && storage) {
        try {
          const fileRef = storageRef(storage, docItem.storagePath);
          await deleteObject(fileRef);
        } catch (sErr) {
          console.warn("Storage delete notice:", sErr);
        }
      }
      await deleteDoc(doc(db, "users", currentUser.uid, "documents", docItem.id));
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleClearAllDocuments = async () => {
    if (!currentUser || !db) return;
    setIsClearAllDocsDialogOpen(false);

    try {
      for (const item of uploadedDocs) {
        if (item.storagePath && storage) {
          try {
            await deleteObject(storageRef(storage, item.storagePath));
          } catch (e) {
            console.warn("Storage deletion:", e);
          }
        }
        await deleteDoc(doc(db, "users", currentUser.uid, "documents", item.id));
      }
      setUploadingQueue([]);
    } catch (err) {
      console.error("Failed to clear all documents:", err);
    }
  };

  const { isDragging, errors: hookValidationErrors, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps } = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    currentFilesCount: uploadedDocs.length,
    onFilesSelected: (files) => {
      handleUploadFiles(files);
    },
  });

  const getFileIcon = (fileObj) => {
    const type = fileObj?.type || "";
    if (type.startsWith("image/")) return <ImageIcon className="size-4" />;
    if (type.startsWith("video/")) return <VideoIcon className="size-4" />;
    if (type.startsWith("audio/")) return <HeadphonesIcon className="size-4" />;
    if (type.includes("pdf")) return <FileTextIcon className="size-4" />;
    if (type.includes("word") || type.includes("doc")) return <FileTextIcon className="size-4" />;
    if (type.includes("excel") || type.includes("sheet")) return <FileSpreadsheetIcon className="size-4" />;
    if (type.includes("zip") || type.includes("rar")) return <FileArchiveIcon className="size-4" />;
    return <FileTextIcon className="size-4" />;
  };

  // --- Document preview helpers ---
  const getFileExt = (name = "") => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");

  const renderPreview = (docItem) => {
    const type = docItem.type || "";
    const ext = getFileExt(docItem.name);
    const url = docItem.downloadUrl;

    const isImage = type.startsWith("image/");
    const isPdf = type === "application/pdf" || ext === "pdf";
    const isVideo = type.startsWith("video/");
    const isAudio = type.startsWith("audio/");
    const isPlainText = type === "text/plain" || ext === "txt";
    const isOffice = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext) || /officedocument|msword|ms-excel|ms-powerpoint/.test(type);

    if (!url) {
      return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">This file has no download link.</div>;
    }

    if (isImage) {
      return (
        <div className="flex h-full w-full items-center justify-center overflow-auto">
          <img src={url} alt={docItem.name} className="max-h-full max-w-full object-contain rounded-md" />
        </div>
      );
    }

    if (isPdf) {
      return <iframe src={`${url}#view=FitH`} title={docItem.name} className="h-full w-full rounded-md shadow-lg/10 dark:shadow-white bg-white" />;
    }

    if (isPlainText) {
      return <iframe src={url} title={docItem.name} className="h-full w-full rounded-md border bg-white" />;
    }

    if (isVideo) {
      return <video src={url} controls className="h-full w-full rounded-md bg-black" />;
    }

    if (isAudio) {
      return (
        <div className="flex h-full items-center justify-center">
          <audio src={url} controls className="w-full max-w-md" />
        </div>
      );
    }

    if (isOffice) {
      // Rendered by Microsoft's viewer, which needs a publicly reachable URL (Firebase download URLs qualify).
      return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} title={docItem.name} className="h-full w-full rounded-md border bg-white" />;
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>No preview available for this file type.</p>
        <Button size="sm" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
          <Download className="h-3.5 w-3.5 mr-1" /> Download
        </Button>
      </div>
    );
  };

  const activeErrors = [...hookValidationErrors, ...fileErrors];

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 dark:bg-black/80 font-sans">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Loading Study Buddy...</h2>
          <p className="text-xs text-muted-foreground">Connecting to your secure workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}} className={`flex flex-col flex-1 min-h-screen items-center justify-start font-sans transition-all duration-300 ${backgroundImage ? "bg-cover bg-center bg-no-repeat bg-fixed" : "bg-gray-200 dark:bg-black/50"}`}>
      {/* Level Up Notification Pop-up */}
      {levelUpNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 backdrop-blur-md rounded-full shadow-2xl border border-white/20 dark:border-black/20 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-amber-400 animate-bounce" />
            <span>Level Up! You reached Level {levelUpNotification}!</span>
            <button
              onClick={() => setLevelUpNotification(null)}
              className="ml-2 p-0.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="w-[99vw] flex flex-row items-center justify-between px-4 my-3">
        <div className="text-black text-left dark:text-shadow-sm/50 dark:text-white leading-10 text-5xl py-2 font-['Playwrite_NZ_Basic_Guides'] rounded-xl">
          Study Buddy
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-border/50 shadow-sm text-xs font-semibold text-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Lvl {userLevel}</span>
            <span className="text-muted-foreground font-normal">• {userXp}/{getRequiredXpForLevel(userLevel)} XP</span>
          </div>

          <Dialog>
            <Tooltip>
              <DialogTrigger render={<TooltipTrigger render={<Button className="rounded-3xl bg-white dark:bg-zinc-800 text-black dark:text-white w-12 h-12 p-2 text-2xl text-center shadow-lg hover:scale-105 transition-all">🧑</Button>}/>}/>
              <TooltipContent>User Profile & Settings (Level {userLevel})</TooltipContent>
            </Tooltip>
          <DialogContent className="h-max min-h-90 w-[90vw] !max-w-none">
            <Tabs defaultValue="userset" className="flex items-center">
              <TabsList className="flex gap-x-3">
                <TabsTrigger value="userset">
                  <User className="mr-1.5 h-4 w-4" /> User Settings
                </TabsTrigger>
                <TabsTrigger value="rewards">
                  <Trophy className="mr-1.5 h-4 w-4" /> Progress
                </TabsTrigger>
                <TabsTrigger value="personalization">
                  <Palette className="mr-1.5 h-4 w-4" /> Personalization
                </TabsTrigger>
              </TabsList>

              <TabsContent value="userset" className="p-8 w-full max-w-full flex flex-col items-center">
                <DialogHeader className="flex flex-col w-[60%]">
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your personal profile and preferences. Updates are saved to your secure account.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveProfile} className="space-y-6 py-6">
                  <FieldGroup className="space-y-4 w-[50vw]">
                    <Field>
                      <Label htmlFor="name-input">Full Name</Label>
                      <Input id="name-input" name="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your name" className="mt-1" />
                    </Field>
                    <Field>
                      <Label htmlFor="username-input">Username</Label>
                      <Input id="username-input" name="username" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} placeholder="@username" className="mt-1" />
                    </Field>
                    <Field>
                      <Label>Account Email</Label>
                      <Input disabled value={currentUser?.email || "Signed In"} className="mt-1 opacity-70 cursor-not-allowed bg-muted" />
                    </Field>
                    <Field className="flex flex-row items-center justify-between pt-2 border-t border-border/50">
                      <div className="space-y-0.5">
                        <Label>Theme Preference</Label>
                        <p className="text-xs text-muted-foreground">Switch between light and dark mode appearance</p>
                      </div>
                      <Button type="button" variant="outline" className="!w-32 flex items-center gap-2 cursor-pointer" onClick={toggleTheme}>
                        {isDarkMode ? (
                          <>
                            <Sun className="h-4 w-4 text-amber-500" /> Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="h-4 w-4 text-indigo-500" /> Dark Mode
                          </>
                        )}
                      </Button>
                    </Field>
                  </FieldGroup>

                  <DialogFooter className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Button type="button" variant="destructive" onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                    <div className="flex items-center gap-3">
                      {profileSaveStatus && (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {profileSaveStatus}
                        </span>
                      )}
                      <DialogClose render={<Button variant="outline">Cancel</Button>} />
                      <Button type="submit" disabled={isSavingProfile}>
                        {isSavingProfile ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="rewards" className="p-8 w-full max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Progress</DialogTitle>
                  <DialogDescription>Track your streak, study habits, and level progression.</DialogDescription>
                </DialogHeader>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/40 flex flex-col gap-2.5 my-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
                        {userLevel}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">Level {userLevel}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">
                            Rank
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {userXp >= getRequiredXpForLevel(userLevel)
                            ? "Ready to level up!"
                            : `${Math.round((getRequiredXpForLevel(userLevel) - userXp) * 10) / 10} XP needed to reach Level ${userLevel + 1}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-semibold text-foreground">
                        {userXp} / {getRequiredXpForLevel(userLevel)} XP
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, (userXp / getRequiredXpForLevel(userLevel)) * 100))}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 *:hover:shadow-black *:dark:hover:shadow-white *:hover:shadow-lg/10 *:duration-200">
                  <div className="p-4 rounded-xl bg-muted/40 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Tasks Completed</span>
                    <span className="text-2xl font-bold">{tasks.filter((t) => t.completed).length} Tasks</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Journal Entries</span>
                    <span className="text-2xl font-bold">{journalEntries.length} Entries</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Documents Stored</span>
                    <span className="text-2xl font-bold">{uploadedDocs.length} Files</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">ChatBot Usage</span>
                    <span className="text-2xl font-bold">{messages.filter(m => m.role === 'user').length} Prompts</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personalization" className="flex flex-col items-start pb-10 p-8">
                <div className="flex items-center justify-between w-[70vw] my-5">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Background Theme</Label>
                    <p className="text-xs text-muted-foreground">Pick your preferred background theme. Changes update instantly for your account.</p>
                  </div>
                  {backgroundImage && (
                    <Button variant="outline" size="sm" onClick={clearWallpaper}>
                      Reset to Default
                    </Button>
                  )}
                </div>

                <Carousel className="w-[70vw]">
                  <CarouselContent className="*:select-none p-10">
                    {WALLPAPERS.map((wp) => (
                      <CarouselItem key={wp.id} className="w-[10vw]! basis-1/3">
                        <div onClick={() => handleSelectWallpaper(wp)} className={`cursor-pointer overflow-hidden rounded-xl border-2 transition-all p-1 ${backgroundImage === wp.src ? "border-primary ring-2 ring-primary shadow-lg scale-102" : "border-transparent hover:border-muted-foreground/50"}`}>
                          <img src={wp.src} alt={wp.title} className="w-full h-40 object-cover rounded-lg" />
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
      </div>

      <div className="mt-2 w-[99vw] h-[84vh] items-start *:dark:text-black flex flex-row gap-x-5 *:duration-500">
        <Card className="w-[25vw] shadow-2xl bg-white/90 dark:bg-zinc-900/90 outline backdrop-blur-md h-full p-5 rounded-2xl">
          <Tabs defaultValue="focus">
            <TabsList>
              <TabsTrigger value="focus">
                <Timer className="mr-1.5 h-4 w-4" /> Focus
              </TabsTrigger>
              <TabsTrigger value="journal">
                <NotebookPen className="mr-1.5 h-4 w-4" /> Journal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="focus" keepMounted>
              <div className="flex grow bg-gray-300 shadow-md hover:scale-101 duration-200 animate-out rounded-xl h-full items-center justify-center">
                <PomodoroTimer onFocusComplete={handleFocusSessionComplete} />
              </div>
            </TabsContent>

            <TabsContent value="journal" keepMounted className="relative pt-2">
              <div className="flex flex-col bg-gray-100 dark:bg-zinc-800/90 rounded-xl p-4 shadow h-[72.5vh]">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-sm font-semibold text-foreground">Daily Journal</span>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs dark:text-white">
                        Past Entries ({journalEntries.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[80vw] max-w-lg max-h-[80vh] h-full overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Journal History</DialogTitle>
                        <DialogDescription>{journalEntries.length === 0 ? "You are yet to write a Journal Entry." : journalEntries.length === 1 ? "You've journalled 1 time" : `You've journalled ${journalEntries.length} times.`}</DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="flex-1 max-h-[57.5vh] pr-4 my-2">
                        {journalEntries.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">No journal entries yet. Start logging your thoughts!</p>
                        ) : (
                          <div className="space-y-3">
                            {journalEntries.map((entry) => (
                              <div key={entry.id} className="p-3 rounded-lg dark:hover:shadow-white hover:shadow-lg/10 hover:scale-101 duration-200 bg-background/50 flex flex-col gap-1 relative group">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-muted-foreground">{entry.timestamp}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteJournal(entry.id)}>
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

                <div className="text-xs font-medium text-muted-foreground pb-2">{currentDateTime || "Loading date & time..."}</div>

                <form onSubmit={handleSaveJournal} className="flex flex-col flex-1 gap-2">
                  <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="What's on your mind today?" className="flex-1 w-full bg-background/60 border border-border/60 rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                  <Button type="submit" size="sm" className="w-full">Log</Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Center Column: AI Chat - Updated with ReactMarkdown */}
        <div className="dark:bg-zinc-900/90 w-[60%] rounded-2xl shadow-2xl flex flex-col items-center justify-between relative bg-white/90 backdrop-blur-md h-full">
          <div className="w-[95%] pt-3 flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Study Buddy AI Assistant</span>
            {messages.length > 1 && (
              <Dialog open={isClearChatDialogOpen} onOpenChange={setIsClearChatDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="xs" className="h-6 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Clear Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clear Chat History?</DialogTitle>
                    <DialogDescription>This will permanently remove your AI conversation history from your account.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" size="sm" onClick={handleClearChatHistory}>Clear History</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <ScrollArea className="w-[90%] flex flex-col h-[75%] rounded px-5">
            <div className="flex flex-col space-y-4 py-4">
              {messages.map((msg, index) => (
                <Bubble
                  key={msg.id || index}
                  variant={msg.role === "user" ? "muted" : "default"}
                  align={msg.role === "user" ? "end" : "start"}
                  className={`text-xl ${msg.role === "user" ? "ml-30 text-right" : "mr-30 text-left text-gray-900 dark:text-white"}`}
                >
                  <BubbleContent>
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </BubbleContent>
                </Bubble>
              ))}
              {isLoading && (
                <Bubble className="text-xl mr-30 text-left text-muted-foreground animate-pulse">
                  <BubbleContent className="animate-bounce">Thinking...</BubbleContent>
                </Bubble>
              )}
            </div>
          </ScrollArea>

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
            <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-full h-12 w-12 shrink-0 cursor-pointer">
              <SendHorizontal />
            </Button>
          </form>
        </div>

        <div className="rounded-2xl w-[25vw] flex flex-col">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md h-[55vh] w-[25vw] rounded-2xl shadow-2xl overflow-hidden">
            <Tabs defaultValue="todo" className="rounded-2xl p-5 h-full flex flex-col">
              <TabsList>
                <TabsTrigger value="todo">
                  <CircleCheckBig className="mr-1.5 h-4 w-4" /> To-Do
                </TabsTrigger>
                <TabsTrigger value="docs">
                  <Files className="mr-1.5 h-4 w-4" /> Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todo" className="flex-1 flex flex-col min-h-0 pt-3 space-y-3">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <Input placeholder="What are you working on?" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} className="h-9 text-xs text-foreground dark:bg-zinc-800/80 dark:border-zinc-700 border-black/50" />
                  <Button type="submit" size="sm" className="h-9 px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <div className="flex items-center justify-between text-sm text-foreground px-1">
                  <span>{tasks.filter((t) => t.completed).length}/{tasks.length} completed</span>
                </div>

                <ScrollArea className="flex-1 pr-2">
                  {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm border text-foreground border-dashed rounded-lg py-8">All Done!</div>
                  ) : (
                    <div className="space-y-1.5 pb-2 *:shadow-xs">
                      {tasks.map((task) => (
                        <div key={task.id} className="group flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/40 transition-colors">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => handleToggleTask(task.id, task.completed)}>
                            <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(task.id, task.completed)} className="border-foreground/50" />
                            <span className={`text-sm truncate transition-all ${task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{task.title}</span>
                          </div>

                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
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
                    <div className={cn("rounded-lg relative border flex flex-row justify-center border-dashed p-4 text-center shrink-0 transition-colors cursor-pointer", isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50")} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={openFileDialog}>
                      <input {...getInputProps()} className="sr-only" />

                      <div className="flex flex-row items-center gap-4">
                        <div className={cn("flex items-center justify-center rounded-full p-1", isDragging ? "bg-primary/10" : "bg-none")}>
                          <UploadIcon className={cn("h-5 w-5", isDragging ? "text-primary" : "text-muted-foreground")} />
                        </div>

                        <div className="space-y-0.5 text-left">
                          <p className="text-sm font-semibold">Upload your files</p>
                          <p className="text-xs text-muted-foreground">Up to 10MB per file</p>
                        </div>

                        <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); openFileDialog(); }} className="ml-auto">
                          <UploadIcon className="h-3.5 w-3.5 mr-1" /> Select
                        </Button>
                      </div>
                    </div>

                    {(uploadedDocs.length > 0 || uploadingQueue.length > 0) && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Files</h4>
                          <div className="flex items-center gap-1">
                            {uploadedDocs.length > 0 && <Badge size="sm" variant="success-light">Saved: {uploadedDocs.length}</Badge>}
                            {uploadingQueue.length > 0 && <Badge size="sm" variant="secondary">Uploading: {uploadingQueue.length}</Badge>}
                          </div>
                        </div>

                        {uploadedDocs.length > 0 && (
                          <Dialog open={isClearAllDocsDialogOpen} onOpenChange={setIsClearAllDocsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="xs">Clear all</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete All Documents?</DialogTitle>
                                <DialogDescription>This will permanently remove all your files from Firebase Storage.</DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="flex justify-end gap-2 pt-2">
                                <DialogClose asChild>
                                  <Button variant="outline" size="sm">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" size="sm" onClick={handleClearAllDocuments}>Delete All</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )}

                    <ScrollArea className="flex-1 mt-2 pr-3 overflow-y-auto">
                      {uploadedDocs.length === 0 && uploadingQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg text-center p-4 my-2">
                          <Files className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-xs font-medium text-muted-foreground">No documents uploaded yet.</p>
                          <p className="text-[11px] text-muted-foreground/70">Files you upload are securely saved to your account.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 pb-2">
                          {uploadingQueue.map((item) => (
                            <div key={item.id} className="border-border bg-card rounded-lg border p-2.5 shadow-xs">
                              <div className="flex items-start gap-2.5">
                                <div className="shrink-0 text-muted-foreground rounded-lg flex h-10 w-10 items-center justify-center border border-border">
                                  {getFileIcon(item.file)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="inline-flex flex-col justify-center truncate font-medium">
                                      <span className="text-xs truncate">{item.file.name}</span>
                                      <span className="text-muted-foreground text-[10px]">{formatBytes(item.file.size)} • Uploading...</span>
                                    </p>
                                  </div>
                                  <div className="mt-2">
                                    <Progress value={item.progress} className="h-1.5" />
                                  </div>
                                  {item.status === "error" && item.error && (
                                    <Alert variant="destructive" className="mt-2 px-2 py-1">
                                      <CircleAlertIcon className="size-3.5" />
                                      <AlertTitle className="text-xs">{item.error}</AlertTitle>
                                    </Alert>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {uploadedDocs.map((docItem) => (
                            <div key={docItem.id} className="border-border bg-card rounded-lg border p-2.5 shadow-xs hover:border-primary/40 transition-colors group">
                              <div className="flex items-start gap-2.5">
                                <div className="shrink-0">
                                  {docItem.downloadUrl && (docItem.type || "").startsWith("image/") ? (
                                    <img src={docItem.downloadUrl} alt={docItem.name} className="rounded-lg h-10 w-10 border object-cover" />
                                  ) : (
                                    <div className="border-border text-muted-foreground rounded-lg flex h-10 w-10 items-center justify-center border">
                                      {getFileIcon(docItem)}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="min-w-0 pr-2">
                                      <button type="button" onClick={() => setPreviewDoc(docItem)} className="text-xs font-medium text-foreground hover:text-primary truncate block max-w-full text-left hover:underline cursor-pointer" title={`Preview ${docItem.name}`}>
                                        {docItem.name}
                                      </button>
                                      <span className="text-muted-foreground text-[10px]">{formatBytes(docItem.size)}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {docItem.downloadUrl && (
                                        <a href={docItem.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary rounded transition-colors" title="Download">
                                          <Download className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                      <Button onClick={() => handleDeleteDocument(docItem)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Delete file">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {activeErrors.length > 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <CircleAlertIcon />
                        <AlertTitle>Upload Issue</AlertTitle>
                        <AlertDescription>
                          {activeErrors.map((error, index) => (
                            <p key={index} className="text-xs last:mb-0">{error}</p>
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
            <AudioPlayer />
          </div>
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="w-[95vw] h-[90vh] !max-w-5xl flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewDoc?.name}</DialogTitle>
            <DialogDescription>{previewDoc ? formatBytes(previewDoc.size) : ""}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0">{previewDoc && renderPreview(previewDoc)}</div>

          <DialogFooter className="flex justify-end gap-2">
            {previewDoc?.downloadUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(previewDoc.downloadUrl, "_blank", "noopener,noreferrer")}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}