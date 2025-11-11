'use client';

import { useState, useEffect } from 'react';
import type { Service } from '@/types';
import { ServiceCard } from '@/components/service-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { mockQuery } from '@/lib/mock-data';
import { ServiceCategory } from '@/types';
import { Search, Filter, ChevronsUpDown } from 'lucide-react';
import { StatsCounter } from '@/components/stats-counter';
import { RecentActivity } from '@/components/recent-activity';

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');

  useEffect(() => {
    // Fetch services from database API
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        
        // Ensure we have an array of services
        const servicesList = Array.isArray(data.services) ? data.services : [];
        setServices(servicesList);
        setFilteredServices(servicesList);
      } catch (error) {
        console.error('Failed to fetch services:', error);
        // Fallback to mock data if API fails
        setServices(mockQuery.services || []);
        setFilteredServices(mockQuery.services || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    // Ensure services is an array before filtering
    if (!Array.isArray(services)) {
      setFilteredServices([]);
      return;
    }

    let filtered = [...services];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.pricePerRequest - b.pricePerRequest;
        case 'price-high':
          return b.pricePerRequest - a.pricePerRequest;
        case 'rating':
          return b.rating - a.rating;
        case 'requests':
          return b.totalRequests - a.totalRequests;
        default:
          return 0;
      }
    });

    setFilteredServices(filtered);
  }, [searchQuery, categoryFilter, sortBy, services]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section - Bento Style */}
      <div className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold mb-6 backdrop-blur-sm">
              Powered by Solana + X402
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              AI Inference Marketplace
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Discover and access powerful AI services on-chain. Pay instantly with SOL and get results in real-time.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Counter */}
        <StatsCounter />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters and Search - Bento Cards */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                <Input
                  placeholder="Search AI services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] h-12 bg-zinc-900 border-zinc-800 text-white focus:border-violet-500 focus:ring-violet-500/20 rounded-lg">
                    <Filter size={16} className="mr-2 text-zinc-400" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value={ServiceCategory.TEXT_GENERATION}>Text Generation</SelectItem>
                    <SelectItem value={ServiceCategory.IMAGE_GENERATION}>Image Generation</SelectItem>
                    <SelectItem value={ServiceCategory.AUDIO_PROCESSING}>Audio Processing</SelectItem>
                    <SelectItem value={ServiceCategory.VIDEO_PROCESSING}>Video Processing</SelectItem>
                    <SelectItem value={ServiceCategory.DATA_ANALYSIS}>Data Analysis</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-12 bg-zinc-900 border-zinc-800 text-white focus:border-violet-500 focus:ring-violet-500/20 rounded-lg">
                    <ChevronsUpDown size={16} className="mr-2 text-zinc-400" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="requests">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Services Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-64 w-full rounded-xl bg-zinc-900/50" />
                  </div>
                ))}
              </div>
            ) : !filteredServices || filteredServices.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-zinc-500" />
                </div>
                <p className="text-lg text-zinc-400 mb-2">No services found</p>
                <p className="text-sm text-zinc-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Sidebar */}
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}