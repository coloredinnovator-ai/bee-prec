'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion } from 'motion/react';
import { MapPin, User, Building, Search } from 'lucide-react';
import Image from 'next/image';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function GlobalMapPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, 'profiles'), where('visibility', '==', 'public'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) =>
            p.coordinates
            && Number.isFinite(p.coordinates.lat)
            && Number.isFinite(p.coordinates.lng)
          );
        setProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(p => 
    p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800">
          <MapPin className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-4">Google Maps API Key Required</h2>
          <p className="text-stone-600 dark:text-zinc-400 mb-4">
            To view the global map of cooperative members, please configure your Google Maps Platform API key.
          </p>
          <div className="text-left text-sm bg-stone-50 dark:bg-zinc-950 p-4 rounded-xl">
            <p className="font-medium mb-2">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-2 text-stone-600 dark:text-zinc-400">
              <li>Get an API key from Google Cloud Console</li>
              <li>Open Settings (⚙️ top-right)</li>
              <li>Select Secrets</li>
              <li>Add <code className="bg-stone-200 dark:bg-zinc-800 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-white dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 p-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Global Network</h1>
            <p className="text-stone-600 dark:text-zinc-400 text-sm">Discover cooperative members and organizations worldwide.</p>
          </div>
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search members, organizations, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-100 dark:bg-zinc-900 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50/50 dark:bg-zinc-950/50 backdrop-blur-sm z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : null}
        
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: 20, lng: 0 }}
            defaultZoom={2}
            mapId="COOP_NETWORK_MAP"
            style={{ width: '100%', height: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {filteredProfiles.map((profile) => (
              <AdvancedMarker
                key={profile.id}
                position={profile.coordinates}
                onClick={() => setSelectedProfile(profile)}
              >
                <Pin 
                  background="#10b981"
                  borderColor="#059669"
                  glyphColor="#fff" 
                />
              </AdvancedMarker>
            ))}

            {selectedProfile && (
              <InfoWindow
                position={selectedProfile.coordinates}
                onCloseClick={() => setSelectedProfile(null)}
              >
                <div className="p-1 max-w-[250px] text-stone-900">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedProfile.avatarUrl ? (
                      <Image src={selectedProfile.avatarUrl} alt={selectedProfile.displayName} width={40} height={40} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-stone-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-base leading-tight">{selectedProfile.displayName}</h3>
                      {selectedProfile.organization && (
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          {selectedProfile.organization}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {selectedProfile.bio && (
                    <p className="text-sm text-stone-600 mb-3 line-clamp-2">{selectedProfile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selectedProfile.focusAreas?.slice(0, 3).map((area: string) => (
                      <span key={area} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase tracking-wider rounded-full font-medium">
                        {area}
                      </span>
                    ))}
                  </div>

                  <a 
                    href={`/profile/${selectedProfile.id}`}
                    className="block w-full text-center py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View Profile
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
