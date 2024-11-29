import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import { Sun, Moon } from "lucide-react";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [formData, setFormData] = useState({
    websiteUrl: "",
    apiKey: "",
    fullVersion: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(current => {
      const newTheme = current === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clean up the website URL by removing protocol and www if present
      let websiteUrl = formData.websiteUrl.trim()
        .replace(/^https?:\/\//, '')  // Remove http:// or https://
        .replace(/^www\./, '')        // Remove www.
        .split('/')[0];               // Only take the domain part

      // Construct the API URL
      const baseUrl = "https://llmstxt.firecrawl.dev/";
      let endpoint = websiteUrl;
      
      if (formData.fullVersion) {
        endpoint += "/full";
      }

      const apiKeyParam = formData.apiKey ? `?FIRECRAWL_API_KEY=${encodeURIComponent(formData.apiKey)}` : '';
      const finalUrl = baseUrl + endpoint + apiKeyParam;
      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(finalUrl)}`;

      console.log('Requesting:', proxiedUrl);

      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate web scraper file. Status: ${response.status}. ${errorText}`);
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Received empty response from server');
      }

      // Create blob and download
      const blob = new Blob([text], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "webscraper.txt";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Web scraper file generated successfully.",
      });
    } catch (error) {
      console.error('Error details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate web scraper file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center p-4 bg-background">
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'light' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <div className="w-full max-w-2xl">
          <motion.div 
            className="rounded-lg border bg-card p-8 shadow-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="mb-6 text-3xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Web Scraper Generator
            </motion.h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  placeholder="Enter domain only (e.g., example.com)"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value.trim() })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter the domain without http:// or www (e.g., example.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Firecrawl API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  placeholder="Enter your Firecrawl API key"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value.trim() })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="fullVersion"
                  checked={formData.fullVersion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, fullVersion: checked })
                  }
                />
                <Label htmlFor="fullVersion">Generate full version</Label>
                <span className="text-sm text-muted-foreground ml-2">
                  ({formData.fullVersion ? 'On' : 'Off'})
                </span>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate web scraper file"}
              </Button>
            </form>

            <motion.footer
              className="mt-8 text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <p>
                Created by Victor Reyes
              </p>
            </motion.footer>
          </motion.div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;
