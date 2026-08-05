"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import AddProjectMessageForm from "./AddProjectMessageForm";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

export type ProjectMessageItem = {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  sender: UserOption;
};

type Conversation = {
  id: number;
  title: string;
  createdAt: Date | string;
  messages: ProjectMessageItem[];
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
  const t = useTranslations("projectMessaging");
  const locale = useLocale();

  const [localConversations, setLocalConversations] =
    useState<Conversation[]>(conversations);

  const [activeConversationId, setActiveConversationId] =
    useState<number | null>(
      conversations[0]?.id ?? null,
    );

  useEffect(() => {
    setLocalConversations(conversations);

    setActiveConversationId((currentId) => {
      const currentStillExists = conversations.some(
        (conversation) =>
          conversation.id === currentId,
      );

      if (currentStillExists) {
        return currentId;
      }

      return conversations[0]?.id ?? null;
    });
  }, [conversations]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const sortedConversations = useMemo(
    () =>
      [...localConversations].sort(
        (first, second) => {
          const firstLatestMessage =
            first.messages.at(-1)?.createdAt ??
            first.createdAt;

          const secondLatestMessage =
            second.messages.at(-1)?.createdAt ??
            second.createdAt;

          const firstTime = new Date(
            firstLatestMessage,
          ).getTime();

          const secondTime = new Date(
            secondLatestMessage,
          ).getTime();

          return (
            (Number.isNaN(secondTime)
              ? 0
              : secondTime) -
            (Number.isNaN(firstTime)
              ? 0
              : firstTime)
          );
        },
      ),
    [localConversations],
  );

  const activeConversation =
    sortedConversations.find(
      (conversation) =>
        conversation.id === activeConversationId,
    ) ??
    sortedConversations[0] ??
    null;

  function formatDate(
    value: Date | string,
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateFormatter.format(date);
  }

  function handleMessageSent(
    conversationId: number,
    message: ProjectMessageItem,
  ) {
    setLocalConversations((current) => {
      const exists = current.some(
        (item) => item.id === conversationId,
      );

      if (!exists) {
        return [
          {
            id: conversationId,
            title: t("defaultConversationTitle"),
            createdAt: new Date(),
            messages: [message],
          },
          ...current,
        ];
      }

      return current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                message,
              ],
            }
          : conversation,
      );
    });

    setActiveConversationId(conversationId);
  }

  return (
    <section className="workspace-panel">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("title")}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="w-fit rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-blue-300">
          {t("conversationCount", {
            count: localConversations.length,
          })}
        </div>
      </div>

      {!activeConversation ? (
        <div className="ui-empty rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center sm:p-10">
          <div
            aria-hidden="true"
            className="text-4xl"
          >
            💬
          </div>

          <h3 className="mt-4 text-lg font-bold text-white">
            {t("emptyState.title")}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {t("emptyState.description")}
          </p>

          <div className="mt-6 text-start">
            <AddProjectMessageForm
              projectId={projectId}
              onMessageSent={handleMessageSent}
            />
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(14rem,17.5rem)_minmax(0,1fr)] lg:gap-6">
          <aside
            aria-label={t("conversationListLabel")}
            className="workspace-horizontal-scroll flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2 lg:block lg:max-h-[42.5rem] lg:space-y-2 lg:overflow-x-hidden lg:overflow-y-auto lg:p-3"
          >
            {sortedConversations.map(
              (conversation) => {
                const isActive =
                  conversation.id ===
                  activeConversation.id;

                const latestMessage =
                  conversation.messages.at(-1);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      setActiveConversationId(
                        conversation.id,
                      )
                    }
                    aria-pressed={isActive}
                    className={`min-h-11 w-[min(78vw,18rem)] shrink-0 rounded-xl border p-3 text-start transition lg:w-full lg:p-4 ${
                      isActive
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-slate-900 hover:border-blue-500/60"
                    }`}
                  >
                    <p className="truncate font-bold text-white">
                      {conversation.title ||
                        t(
                          "defaultConversationTitle",
                        )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("messageCount", {
                        count:
                          conversation.messages.length,
                      })}
                    </p>

                    {latestMessage && (
                      <p className="mt-2 line-clamp-2 break-words text-xs text-slate-400">
                        {latestMessage.message}
                      </p>
                    )}
                  </button>
                );
              },
            )}
          </aside>

          <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950">
            <div className="border-b border-slate-800 p-3 sm:p-4">
              <h3 className="break-words font-bold text-white">
                {activeConversation.title ||
                  t("defaultConversationTitle")}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {t("messageCount", {
                  count:
                    activeConversation.messages.length,
                })}
              </p>
            </div>

            <div
              aria-live="polite"
              className="max-h-[32rem] space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-5"
            >
              {activeConversation.messages.length ===
              0 ? (
                <div className="ui-empty rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                  {t("noMessages")}
                </div>
              ) : (
                activeConversation.messages.map(
                  (message) => {
                    const isMine =
                      message.sender.id ===
                      currentUserId;

                    const senderName =
                      message.sender.name ||
                      message.sender.email ||
                      t("unknownSender");

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <article
                          className={`max-w-[92%] rounded-2xl px-3 py-2.5 sm:max-w-[78%] sm:p-4 ${
                            isMine
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <p className="break-words text-xs font-bold">
                              {isMine
                                ? t("you")
                                : senderName}
                            </p>

                            <time
                              dateTime={
                                Number.isNaN(
                                  new Date(
                                    message.createdAt,
                                  ).getTime(),
                                )
                                  ? undefined
                                  : new Date(
                                      message.createdAt,
                                    ).toISOString()
                              }
                              className="shrink-0 text-[11px] opacity-70"
                            >
                              {formatDate(
                                message.createdAt,
                              )}
                            </time>
                          </div>

                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.message}
                          </p>
                        </article>
                      </div>
                    );
                  },
                )
              )}
            </div>

            <div className="border-t border-slate-800 p-3 sm:p-4">
              <AddProjectMessageForm
                key={activeConversation.id}
                projectId={projectId}
                conversationId={
                  activeConversation.id
                }
                onMessageSent={
                  handleMessageSent
                }
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
