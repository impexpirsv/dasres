import AddProjectMessageForm from "./AddProjectMessageForm";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Message = {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  sender: UserOption;
};

type Conversation = {
  id: number;
  title: string;
  createdAt: Date;
  messages: Message[];
};

export default function ProjectMessaging({
  projectId,
  conversations,
  currentUserId,
}: {
  projectId: number;
  conversations: Conversation[];
  currentUserId: number;
}) {
  const activeConversation = conversations[0] ?? null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Messaging</h2>
          <p className="mt-1 text-sm text-slate-400">
            Internal communication between customer, provider and project team.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-blue-300">
          {conversations.length} Conversation(s)
        </div>
      </div>

      {!activeConversation ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-10 text-center">
          <div className="text-4xl">💬</div>
          <h3 className="mt-4 text-lg font-bold text-white">
            No conversation yet
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Send the first message to start the project conversation.
          </p>

          <div className="mt-6">
            <AddProjectMessageForm projectId={projectId} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`rounded-xl border p-4 ${
                  conversation.id === activeConversation.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                <p className="font-bold text-white">{conversation.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {conversation.messages.length} message(s)
                </p>
              </div>
            ))}
          </aside>

          <div className="rounded-2xl border border-slate-800 bg-slate-950">
            <div className="border-b border-slate-800 p-4">
              <h3 className="font-bold text-white">
                {activeConversation.title}
              </h3>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
              {activeConversation.messages.map((message) => {
                const isMine = message.sender.id === currentUserId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 ${
                        isMine
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className="text-xs font-bold">
                          {message.sender.name || message.sender.email}
                        </p>
                        <p className="text-[11px] opacity-70">
                          {message.createdAt.toLocaleString()}
                        </p>
                      </div>

                      <p className="text-sm leading-6">{message.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 p-4">
              <AddProjectMessageForm
                projectId={projectId}
                conversationId={activeConversation.id}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}