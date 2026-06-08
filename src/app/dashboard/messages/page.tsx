import { UserMessagesInbox } from "@/components/chat/user-messages-inbox";

export default function MessagesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with our support team — like Messenger</p>
      </div>

      <UserMessagesInbox />
    </div>
  );
}
