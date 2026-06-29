'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Clock, Ticket, Star, Hotel, Wallet, Plane, Utensils, Activity,
  Loader2, Globe, Lightbulb, Bus, CloudSun, Info, Trophy, AlertTriangle, Phone } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function photoUrl(query) {
  return `${API_URL}/api/places/photo?query=${encodeURIComponent(query || 'travel destination')}`;
}

export default function SharedTripPage() {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/shared/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.trip) setTrip(data.trip);
        else setError(data.message || 'Trip not found.');
        setLoading(false);
      })
      .catch(() => { setError('Failed to load trip.'); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-center px-4">
      <p className="text-4xl mb-4">🔒</p>
      <p className="text-white font-bold text-lg mb-2">Trip not available</p>
      <p className="text-slate-400 text-sm">{error}</p>
    </div>
  );

  const budgetLabel = { low: 'Budget', medium: 'Moderate', high: 'Luxury' };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Banner */}
      <div className="bg-violet-600/10 border-b border-violet-500/20 px-5 py-2.5 text-center">
        <p className="text-xs text-violet-300">
          👁 Shared trip — view only · <a href="/" className="underline hover:text-violet-200">Create your own with AI Trip Planner</a>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-2.5 mb-3">
            <MapPin className="w-7 h-7 text-violet-500 shrink-0" />
            {trip.destination}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
              {trip.days} day{trip.days > 1 ? 's' : ''}
            </span>
            <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
              {budgetLabel[trip.budgetType]}
            </span>
            <span className="text-xs font-semibold text-white/55 bg-white/6 border border-white/8 px-3 py-1.5 rounded-full capitalize">
              {trip.travelersType}
            </span>
            {trip.interests?.map(i => (
              <span key={i} className="text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full">{i}</span>
            ))}
          </div>
        </div>

        {/* Budget */}
        {trip.estimatedBudget && (
          <section className="bg-linear-to-r from-violet-500 to-amber-500 text-white rounded-2xl p-6 mb-7">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Wallet className="w-4 h-4" /> Estimated Budget
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[['Flights', trip.estimatedBudget.flights, <Plane className="w-3.5 h-3.5" />],
                ['Accommodation', trip.estimatedBudget.accommodation, <Hotel className="w-3.5 h-3.5" />],
                ['Food', trip.estimatedBudget.food, <Utensils className="w-3.5 h-3.5" />],
                ['Activities', trip.estimatedBudget.activities, <Activity className="w-3.5 h-3.5" />],
              ].map(([label, value, icon]) => (
                <div key={label} className="bg-black/15 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-violet-100/75 text-xs mb-1">{icon}{label}</div>
                  <div className="font-bold text-base">{value}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/25 pt-3 flex justify-between items-center">
              <span className="font-semibold text-violet-100/80 text-sm">Total Estimated</span>
              <span className="text-2xl font-extrabold">{trip.estimatedBudget.total}</span>
            </div>
          </section>
        )}

        {/* Hotels */}
        {trip.hotels?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-violet-500" /> Recommended Hotels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {trip.hotels.map((hotel, i) => (
                <div key={i} className="bg-[#1e293b] border border-white/8 rounded-xl overflow-hidden">
                  <img src={photoUrl(`${hotel.name} hotel ${trip.destination}`)} alt={hotel.name}
                    className="w-full h-36 object-cover"
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div className="p-4">
                    <h3 className="font-bold text-white/85 text-sm leading-tight mb-1">{hotel.name}</h3>
                    <span className="inline-block text-violet-400 bg-violet-500/10 text-xs font-medium px-2 py-0.5 rounded-full mb-2">{hotel.type}</span>
                    <div className="flex items-center gap-1 text-xs text-white/45 mb-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {hotel.rating}
                    </div>
                    <div className="text-sm font-semibold text-white/70">{hotel.pricePerNight}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Itinerary */}
        <section className="mt-6">
          <h2 className="text-xl font-bold text-white mb-5">Day-by-Day Itinerary</h2>
          <div className="space-y-3">
            {trip.itinerary?.map((day, dayIndex) => (
              <div key={day.day} className="bg-[#1e293b] border border-white/8 rounded-2xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#334155] transition-colors cursor-pointer"
                  onClick={() => setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex)}
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-violet-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      {day.day}
                    </span>
                    <div>
                      <div className="font-bold text-white/85 text-sm">Day {day.day}</div>
                      {day.theme && <div className="text-xs text-white/40 mt-0.5">{day.theme}</div>}
                    </div>
                  </div>
                </div>
                {expandedDay === dayIndex && (
                  <div className="border-t border-white/6 px-5 py-5 space-y-6">
                    {day.activities?.map((act, actIndex) => (
                      <div key={actIndex} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 shrink-0" />
                          {actIndex < day.activities.length - 1 && <div className="w-px flex-1 bg-violet-500/15 mt-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <img src={photoUrl(`${act.title} ${trip.destination}`)} alt={act.title}
                            className="w-full h-44 object-cover rounded-xl mb-3"
                            onError={e => { e.target.style.display = 'none'; }} />
                          {act.time && (
                            <span className="flex items-center gap-1 text-xs text-violet-400 font-medium mb-1">
                              <Clock className="w-3 h-3" /> {act.time}
                            </span>
                          )}
                          <h4 className="font-semibold text-white/85 text-sm">{act.title}</h4>
                          {act.description && <p className="text-sm text-white/45 mt-1 leading-relaxed">{act.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {act.ticketPrice && <span className="flex items-center gap-1 text-xs text-white/40"><Ticket className="w-3 h-3" /> {act.ticketPrice}</span>}
                            {act.rating && <span className="flex items-center gap-1 text-xs text-white/40"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {act.rating}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center bg-violet-500/10 border border-violet-500/20 rounded-2xl p-8">
          <p className="text-2xl mb-3">✈️</p>
          <h3 className="text-lg font-bold text-white mb-2">Plan your own AI trip</h3>
          <p className="text-slate-400 text-sm mb-4">Get a personalised itinerary, budget, hotels and more in under 60 seconds.</p>
          <a href="/" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Start for free →
          </a>
        </div>
      </div>
    </div>
  );
}
