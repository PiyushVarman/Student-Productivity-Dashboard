import Image from "next/image";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Bubble, BubbleContent} from "@/components/ui/bubble";
import {CircleCheckBig, Files, NotebookPen, Timer} from "lucide-react";
import {ScrollArea,ScrollBar } from "@/components/ui/scroll-area";
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-start font-sans bg-gray-200"> {/*bg-[#faf9f6]*/} 
      <div className="flex items-center justify-center relative">
        <div className=" w-screen my-5 pl-5 text-black  text-left leading-10 text-5xl py-2 font-['Playwrite_NZ_Basic_Guides']">Study Buddy </div>
        <Tooltip>
          <TooltipTrigger className="rounded-3xl bg-white w-10 py-2 absolute right-10 text-center">🧑</TooltipTrigger>
          <TooltipContent>User</TooltipContent>
        </Tooltip>
      </div>
      {/* Apps */}
      <div className="mt-2  w-[99vw] h-[84vh] items-start *:dark:text-black  flex flex-row gap-x-5 *:duration-500">
        <div className="w-[25vw] shadow-2xl bg-white h-full p-5 rounded-2xl">
          <Tabs>
            <TabsList defaultValue="focus">
              <TabsTrigger value="focus"><Timer/>Focus</TabsTrigger>
              <TabsTrigger value="journal"><NotebookPen/>Journal</TabsTrigger>
            </TabsList>
            <TabsContent value="focus">
              <div className="flex grow bg-gray-300 shadow-md hover:scale-101 duration-200 animate-out rounded-xl py-[35vh] items-center justify-center">
                Focus Timer
              </div>
            </TabsContent>
            <TabsContent value="journal">
              <div className="flex grow bg-gray-300 shadow-md hover:scale-101 duration-200 animate-out rounded-xl py-[35vh] items-center justify-center">
                Journal
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="rounded-2xl shadow-2xl flex flex-col items-center justify-center relative bg-white h-full">
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
          <textarea className="bg-black/50 w-[95%] relative bottom-5 backdrop-blur-xs shadow-xl py-5 rounded-3xl focus:bg-black duration-200 px-10 text-white"></textarea>
        </div>
        <div className="rounded-2xl w-[25vw] flex flex-col ">
          <div className="bg-white h-[55vh] rounded-2xl shadow-2xl">
            <Tabs defaultValue="todo" className="rounded-2xl p-5">
              <TabsList>
                <TabsTrigger value="todo"><CircleCheckBig/>To-Do</TabsTrigger>
                <TabsTrigger value="docs"><Files/>Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="todo">
                <ScrollArea>
                  <div>
                    To-Do List.
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="docs">
                <div>
                  Documents.
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="h-[26.5vh] shadow-2xl bg-white rounded-2xl mt-5 ">
          </div>
        </div>
      </div>
    </div>
  );
}
 
 