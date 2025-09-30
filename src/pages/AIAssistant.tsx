import { useState, useRef, useEffect } from 'react';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { HolographicButton } from '@/components/HolographicButton';
import { HolographicOrb } from '@/components/HolographicOrb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles } from 'lucide-react';
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    // Add placeholder assistant message for streaming
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }]);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: messageText }
          ],
          stream: true
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              accumulatedContent += content;
              
              // Update the last assistant message with accumulated content
              setMessages(prev => prev.map(msg => 
                msg.id === assistantId 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ));
            }
          } catch (e) {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI response');
      
      // Remove the placeholder message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantId));
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
                <div className="relative">
                  <HolographicOrb isThinking={isLoading} />
                </div>
                <span className="font-orbitron">VISHWA-AI</span>
                <Sparkles className="w-5 h-5 text-neon-magenta" />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
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