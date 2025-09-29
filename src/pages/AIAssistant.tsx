import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { HolographicButton } from '@/components/HolographicButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to VISHWA-AI! I\'m your specialized space biology assistant. Ask me about microgravity effects, astrobiology, space missions, or biological experiments in space environments.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ]
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      
      <div className="relative z-10 pt-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-gradient-neon mb-4">
              VISHWA-AI Assistant
            </h1>
            <p className="text-xl text-foreground/80 font-exo">
              Your specialized space biology research companion
            </p>
          </div>

          <Card className="holo-panel border-holo-border h-[600px] flex flex-col">
            <CardHeader className="border-b border-holo-border">
              <CardTitle className="flex items-center gap-3 text-neon-cyan">
                <div className="w-10 h-10 rounded-full bg-gradient-neon p-2 pulse-orb">
                  <Bot className="w-full h-full text-background" />
                </div>
                <span className="font-orbitron">VISHWA-AI</span>
                <Sparkles className="w-5 h-5 text-neon-magenta" />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-neon-magenta text-background' 
                            : 'bg-neon-cyan text-background'
                        }`}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-neon-magenta/20 border border-neon-magenta/30'
                            : 'bg-holo-base border border-holo-border'
                        }`}>
                          <p className="font-exo text-foreground whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <span className="text-xs text-foreground/50 mt-2 block">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-cyan text-background flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-holo-base border border-holo-border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
                          <span className="text-foreground/70 font-exo">VISHWA-AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="border-t border-holo-border p-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about space biology, microgravity effects, astrobiology..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="bg-background/50 border-holo-border focus:border-neon-cyan"
                    disabled={isLoading}
                  />
                  <HolographicButton
                    onClick={sendMessage}
                    icon={Send}
                    disabled={!input.trim() || isLoading}
                    className="px-4"
                  >
                    Send
                  </HolographicButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}