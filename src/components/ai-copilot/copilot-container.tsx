"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WifiOff, RefreshCw } from "lucide-react";
import { useCopilotStore } from "@/stores/copilot-store";
import { useCopilotContext } from "@/hooks/use-copilot-context";
import { useCopilotChat } from "@/hooks/use-copilot-chat";
import { ChatInterface } from "@/components/ai-copilot/chat-interface";
import { QuickActions } from "@/components/ai-copilot/quick-actions";

export function CopilotContainer() {
  const { isOpen, close, setContext } = useCopilotStore();
  const context = useCopilotContext();

  const caseId = context.case_id || null;
  const {
    messages,
    isTyping,
    isConnected,
    connectionError,
    sendMessage,
    reconnect,
    clearMessages,
  } = useCopilotChat({ caseId });

  // Sync route context to store
  useEffect(() => {
    setContext(context);
  }, [context, setContext]);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const handleQuickAction = (action: { prompt: string }) => {
    sendMessage(action.prompt);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-[420px] sm:w-[480px] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">
              Assistant IA
            </SheetTitle>
            <div className="flex items-center gap-2">
              {caseId && (
                <Badge variant="outline" className="text-xs">
                  {isConnected ? "Connecte" : "Deconnecte"}
                </Badge>
              )}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={clearMessages}
                >
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Connection error banner */}
        {connectionError && (
          <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span className="flex-1">Connexion perdue</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={reconnect}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reconnecter
            </Button>
          </div>
        )}

        {/* Quick actions when no messages */}
        {messages.length === 0 && !connectionError && (
          <div className="px-4 pt-3">
            <QuickActions
              onActionClick={handleQuickAction}
              compact
            />
          </div>
        )}

        {/* Chat interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isTyping}
            placeholder={
              connectionError
                ? "Reconnectez-vous pour envoyer un message..."
                : "Posez votre question..."
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
