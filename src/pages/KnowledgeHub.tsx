import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Database, ExternalLink, Loader2, Globe, Microscope, BarChart3, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { HolographicButton } from '@/components/HolographicButton';
import { DataDashboard } from '@/components/DataDashboard';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { toast } from 'sonner';

interface DataItem {
  id?: string;
  title: string;
  description?: string;
  source: string;
  type: string;
  url?: string;
  authors?: string;
  year?: string;
  category?: string;
}

const categories = [
  { name: 'All', value: '' },
  { name: 'NASA Missions', value: 'nasa' },
  { name: 'Astrobiology', value: 'astrobiology' },
  { name: 'Microgravity', value: 'microgravity' },
  { name: 'Mars Research', value: 'mars' },
  { name: 'Space Medicine', value: 'space medicine' },
];

export default function KnowledgeHub() {
  const [searchTerm, setSearchTerm] = useState('space biology');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [nasaData, setNasaData] = useState<DataItem[]>([]);
  const [ncbiData, setNcbiData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'nasa' | 'ncbi' | 'all'>('all');
  const [showVisualizations, setShowVisualizations] = useState(true);

  const fetchNASAData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-nasa-data', {
        body: { 
          endpoint: 'planetary/apod',
          limit: 12
        }
      });

      if (error) throw error;

      const transformedData = (data.data || []).map((item: any) => ({
        id: item.date || Math.random().toString(),
        title: item.title || 'NASA Data',
        description: item.explanation || item.description || 'NASA space data',
        source: 'NASA',
        type: 'space-data',
        url: item.url || item.hdurl,
        category: 'nasa'
      }));

      setNasaData(transformedData);
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      toast.error('Failed to fetch NASA data');
    }
  };

  const fetchNCBIData = async () => {
    try {
      setLoading(true);
      const searchQuery = selectedCategory ? `${searchTerm} ${selectedCategory}` : searchTerm;
      
      const { data, error } = await supabase.functions.invoke('fetch-ncbi-data', {
        body: { 
          term: searchQuery,
          retmax: 15
        }
      });

      if (error) throw error;

      const transformedData = (data.data || []).map((item: any) => ({
        id: item.pmid || Math.random().toString(),
        title: item.title,
        description: item.abstract,
        source: 'NCBI PubMed',
        type: 'research-article',
        url: item.url,
        authors: item.authors,
        year: item.year,
        category: 'research'
      }));

      setNcbiData(transformedData);
    } catch (error) {
      console.error('Error fetching NCBI data:', error);
      toast.error('Failed to fetch NCBI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNASAData();
    fetchNCBIData();
  }, []);

  const handleSearch = async () => {
    await fetchNCBIData();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const getFilteredData = () => {
    let allData = [...nasaData, ...ncbiData];
    
    if (activeTab === 'nasa') allData = nasaData;
    if (activeTab === 'ncbi') allData = ncbiData;
    
    if (selectedCategory) {
      allData = allData.filter(item => 
        item.category?.includes(selectedCategory) || 
        item.source.toLowerCase().includes(selectedCategory)
      );
    }
    
    return allData;
  };

  const data = getFilteredData();

  // Calculate category data for dashboard
  const categoryData = categories
    .filter(cat => cat.value !== '')
    .map(cat => ({
      name: cat.name,
      value: data.filter(item => 
        item.category?.includes(cat.value) || 
        item.source.toLowerCase().includes(cat.value)
      ).length
    }));

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      
      <div className="relative z-10 pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-gradient-neon mb-6">
              Knowledge Hub
            </h1>
            <p className="text-xl text-foreground/80 font-exo max-w-3xl mx-auto">
              Explore the vast repository of space biology research from NASA missions and NCBI databases
            </p>
          </div>

          {/* Search and Filters */}
          <div className="holo-panel rounded-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan w-5 h-5" />
                <Input
                  placeholder="Search space biology research..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-holo-border focus:border-neon-cyan"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <HolographicButton 
                onClick={handleSearch} 
                icon={Search}
                disabled={loading}
                className="w-full lg:w-auto"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </HolographicButton>

              <Button
                variant="outline"
                size="default"
                onClick={() => setShowVisualizations(!showVisualizations)}
                className="border-holo-border hover:border-neon-cyan bg-holo-base w-full lg:w-auto"
              >
                {showVisualizations ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Visualizations
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show Visualizations
                  </>
                )}
              </Button>
            </div>

            {/* Category Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category.value)}
                  className={selectedCategory === category.value ? 
                    "bg-neon-cyan text-background hover:bg-neon-cyan/80" : 
                    "border-holo-border hover:border-neon-cyan"
                  }
                >
                  {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Visualization Dashboard */}
      {showVisualizations && (
        <>
          <DataDashboard 
            nasaCount={nasaData.length}
            ncbiCount={ncbiData.length}
            categoryData={categoryData}
          />

          {/* Knowledge Graph */}
          {data.length > 0 && (
            <div className="mb-8">
              <KnowledgeGraph data={data} />
            </div>
          )}
        </>
      )}

      {/* Data Source Tabs */}
          <div className="flex gap-4 mb-8">
            <Button
              variant={activeTab === 'all' ? "default" : "outline"}
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 
                "bg-neon-cyan text-background" : 
                "border-holo-border hover:border-neon-cyan"
              }
            >
              <Database className="w-4 h-4 mr-2" />
              All Sources ({data.length})
            </Button>
            <Button
              variant={activeTab === 'nasa' ? "default" : "outline"}
              onClick={() => setActiveTab('nasa')}
              className={activeTab === 'nasa' ? 
                "bg-neon-cyan text-background" : 
                "border-holo-border hover:border-neon-cyan"
              }
            >
              <Globe className="w-4 h-4 mr-2" />
              NASA ({nasaData.length})
            </Button>
            <Button
              variant={activeTab === 'ncbi' ? "default" : "outline"}
              onClick={() => setActiveTab('ncbi')}
              className={activeTab === 'ncbi' ? 
                "bg-neon-cyan text-background" : 
                "border-holo-border hover:border-neon-cyan"
              }
            >
              <Microscope className="w-4 h-4 mr-2" />
              NCBI ({ncbiData.length})
            </Button>
          </div>

          {/* Results Grid */}
          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-neon-cyan mx-auto mb-4" />
                <p className="text-foreground/70 font-exo">Searching cosmic databases...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((item, index) => (
                <Card key={item.id || index} className="holo-panel hover-scale border-holo-border">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-orbitron font-semibold text-foreground line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-xs whitespace-nowrap ${
                          item.source === 'NASA' ? 'border-neon-cyan text-neon-cyan' : 'border-neon-magenta text-neon-magenta'
                        }`}
                      >
                        {item.source}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/70 font-exo text-sm mb-4 line-clamp-3">
                      {item.description}
                    </p>
                    
                    {item.authors && (
                      <p className="text-xs text-foreground/60 mb-2">
                        <strong>Authors:</strong> {item.authors}
                      </p>
                    )}
                    
                    {item.year && (
                      <p className="text-xs text-foreground/60 mb-4">
                        <strong>Year:</strong> {item.year}
                      </p>
                    )}
                    
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-magenta transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm font-exo">View Source</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {data.length === 0 && !loading && (
            <div className="text-center py-20">
              <Database className="w-16 h-16 text-neon-cyan/30 mx-auto mb-4" />
              <h3 className="text-xl font-orbitron text-foreground/70 mb-2">No Results Found</h3>
              <p className="text-foreground/50 font-exo">Try adjusting your search terms or category filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}