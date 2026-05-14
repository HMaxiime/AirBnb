import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { useListings } from "../../listings/hooks/useListings";
import { useConversations } from "../hooks/useConversations";
import { useMessages } from "../hooks/useMessages";
import { useSendMessage } from "../hooks/useSendMessage";
import { useStartConversation } from "../hooks/useStartConversation";
import { mockChat, Conversation } from "../../../lib/mockDb";
import { format } from "date-fns";

const HOST_REPLIES = [
  "Thanks for your message! I'll get back to you shortly.",
  "Great question! Happy to help with anything you need.",
  "Absolutely! Feel free to reach out anytime before your stay.",
  "Of course! I'll make sure everything is perfect for you.",
  "Good to hear from you! Let me know if you need anything else.",
];

export function GuestChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useMessages(activeId);
  const { mutateAsync: sendMsg, isPending: sending } = useSendMessage();
  const { mutateAsync: startConv, isPending: starting } = useStartConversation();
  const { data: listings = [] } = useListings();

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Scroll to bottom on new messages or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const selectConversation = (conv: Conversation) => {
    setActiveId(conv.id);
    setMobileView("chat");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeId || !user || sending) return;

    const content = input.trim();
    setInput("");

    await sendMsg({
      conversationId: activeId,
      senderId: user.id,
      senderName: user.name,
      content,
    });

    // Simulate host typing then reply
    const typingDelay = 800 + Math.random() * 400;
    const replyDelay = typingDelay + 1500 + Math.random() * 500;

    setTimeout(() => setIsTyping(true), typingDelay);
    setTimeout(async () => {
      setIsTyping(false);
      if (!activeConv) return;
      const reply = HOST_REPLIES[Math.floor(Math.random() * HOST_REPLIES.length)];
      await mockChat.send({
        conversationId: activeId,
        senderId: activeConv.hostId,
        senderName: activeConv.hostName,
        content: reply,
      });
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }, replyDelay);
  };

  const handleNewChat = async (listingId: string) => {
    if (!user) return;
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;

    const conv = await startConv({
      guestId: user.id,
      guestName: user.name,
      hostId: listing.hostId,
      hostName: listing.hostName,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImg: listing.img,
    });

    setActiveId(conv.id);
    setShowNewChat(false);
    setMobileView("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const alreadyChatting = new Set(conversations.map((c) => c.listingId));
  const availableListings = listings.filter((l) => !alreadyChatting.has(l.id));

  return (
    <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden" style={{ height: 500 }}>
      <div className="flex h-full">

        {/* ── Conversation list ── */}
        <div className={`w-full md:w-64 md:flex flex-col border-r border-[#ebebeb] flex-shrink-0 ${mobileView === "chat" ? "hidden" : "flex"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ebebeb]">
            <span className="text-sm font-bold text-gray-900">Messages</span>
            <button
              onClick={() => setShowNewChat((v) => !v)}
              className="text-xs font-semibold text-[#ff5a5f] hover:opacity-75 transition-opacity"
            >
              + New
            </button>
          </div>

          {/* New chat picker */}
          {showNewChat && (
            <div className="border-b border-[#ebebeb] bg-[#fafafa] px-3 py-2">
              <p className="text-xs text-gray-500 mb-2 font-medium">Start a chat about:</p>
              {availableListings.length === 0 ? (
                <p className="text-xs text-gray-400">You already have chats for all listings.</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {availableListings.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleNewChat(l.id)}
                      disabled={starting}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white text-xs font-medium text-gray-700 transition-colors"
                    >
                      <img src={l.img} alt={l.title} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                      <span className="truncate">{l.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-xs text-gray-400 text-center mt-8">
                No conversations yet.<br />Click <strong>+ New</strong> to start one.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-[#f5f5f5] transition-colors ${
                    activeId === conv.id ? "bg-[#fff5f5]" : "hover:bg-gray-50"
                  }`}
                >
                  <img src={conv.listingImg} alt={conv.listingTitle} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{conv.listingTitle}</p>
                    <p className="text-xs text-gray-500 truncate">with {conv.hostName}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {activeConv ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#ebebeb]">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden text-gray-400 hover:text-gray-700 mr-1"
                  aria-label="Back to list"
                >
                  ←
                </button>
                <img src={activeConv.listingImg} alt={activeConv.listingTitle} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{activeConv.listingTitle}</p>
                  <p className="text-xs text-gray-500">with {activeConv.hostName}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-[#ff5a5f] text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">
                          {format(new Date(msg.createdAt), "MMM d · h:mm a")}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-[#ebebeb] flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${activeConv.hostName}…`}
                  disabled={sending || isTyping}
                  className="flex-1 text-sm px-4 py-2.5 border border-[#e0e0e0] rounded-full outline-none focus:border-[#ff5a5f] focus:ring-2 focus:ring-[#ff5a5f]/10 transition-all bg-[#fafafa] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending || isTyping}
                  className="w-9 h-9 bg-[#ff5a5f] rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e0474c] transition-colors"
                  aria-label="Send"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Select a conversation or start a new one.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
