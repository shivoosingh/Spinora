import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { MessageCircle } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_active", true)
    .single();

  const { data: messages } = conversation
    ? await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(full_name, role)")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with our support team</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> Support Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages && messages.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user!.id;
                const sender = msg.sender as { full_name?: string; role?: string };
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2 ${isOwn ? "gradient-bg text-white" : "bg-muted"}`}>
                      {!isOwn && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {sender?.role === "admin" ? "Support" : sender?.full_name}
                        </p>
                      )}
                      <ChatMessageContent message={msg} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Use the floating chat widget to start a conversation with support.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
