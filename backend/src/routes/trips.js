import express from 'express';
import rateLimit from 'express-rate-limit';
import Trip from '../models/Trip.js';
import { protect } from '../middleware/auth.js';
import { generateTripPlan, regenerateDay } from '../agents/orchestrator.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = express.Router();
router.use(protect);

// Trip generation: 5 per hour per user (only for /stream, not read/delete)
const tripGenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.headers.authorization || req.ip,
  message: { message: 'Trip generation limit reached. Please wait an hour before generating more trips.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/trips/stream — SSE: real-time agent progress + save trip
router.post('/stream', tripGenLimiter, async (req, res) => {
  const { destination, destinationPlaceId, days, budgetType, interests, travelersType } = req.body;

  if (!destination || !days || !budgetType || !travelersType)
    return res.status(400).json({ message: 'destination, days, budgetType and travelersType are required' });

  if (days < 1 || days > 30)
    return res.status(400).json({ message: 'Days must be between 1 and 30' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Abort signal — fires on client disconnect OR 90s timeout
  const controller = new AbortController();
  const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(': heartbeat\n\n'); }, 15000);
  const timeout = setTimeout(() => controller.abort('timeout'), 90_000);

  req.on('close', () => controller.abort('disconnect'));

  try {
    // Race: generation vs abort
    const result = await Promise.race([
      generateTripPlan(
        { destination, days, budgetType, interests: interests || [], travelersType },
        (progress) => send('progress', progress)
      ),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error(controller.signal.reason === 'timeout'
            ? 'Generation timed out. Please try again.'
            : 'Request cancelled.'))
        );
      }),
    ]);

    const trip = await Trip.create({
      userId: req.user._id,
      destination,
      destinationPlaceId,
      days,
      budgetType,
      interests: interests || [],
      travelersType,
      itinerary: result.itinerary,
      hotels: result.hotels,
      restaurants: result.restaurants,
      estimatedBudget: result.estimatedBudget,
      destinationInsights: result.destinationInsights,
      emergencyInfo: result.emergencyInfo,
    });

    send('complete', { tripId: trip._id });
  } catch (err) {
    if (err.message !== 'Request cancelled.') {
      send('error', { message: err.message || 'Failed to generate trip. Please try again.' });
    }
  } finally {
    clearTimeout(timeout);
    clearInterval(heartbeat);
    res.end();
  }
});

// POST /api/trips — orchestrate all agents + save trip
router.post('/', async (req, res) => {
  const { destination, destinationPlaceId, days, budgetType, interests, travelersType } = req.body;

  if (!destination || !days || !budgetType || !travelersType)
    return res.status(400).json({ message: 'destination, days, budgetType and travelersType are required' });

  if (days < 1 || days > 30)
    return res.status(400).json({ message: 'Days must be between 1 and 30' });

  try {
    const result = await generateTripPlan({ destination, days, budgetType, interests: interests || [], travelersType });

    const trip = await Trip.create({
      userId: req.user._id,
      destination,
      destinationPlaceId,
      days,
      budgetType,
      interests: interests || [],
      travelersType,
      itinerary: result.itinerary,
      hotels: result.hotels,
      restaurants: result.restaurants,
      estimatedBudget: result.estimatedBudget,
      destinationInsights: result.destinationInsights,
      emergencyInfo: result.emergencyInfo,
    });

    res.status(201).json({ trip });
  } catch {
    res.status(500).json({ message: 'Failed to generate trip. Please try again.' });
  }
});

// GET /api/trips
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch {
    res.status(500).json({ message: 'Could not fetch trips.' });
  }
});

// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Could not fetch trip.' });
  }
});

// PUT /api/trips/:id — update itinerary/notes
router.put('/:id', async (req, res) => {
  const { itinerary, notes } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (itinerary !== undefined) trip.itinerary = itinerary;
    if (notes !== undefined) trip.notes = notes;
    await trip.save();
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Could not update trip.' });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch {
    res.status(500).json({ message: 'Could not delete trip.' });
  }
});

// POST /api/trips/:id/regenerate-day — Day Regeneration Agent
router.post('/:id/regenerate-day', async (req, res) => {
  const { dayNumber, instruction } = req.body;
  if (!dayNumber) return res.status(400).json({ message: 'dayNumber is required' });

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const newDay = await regenerateDay(
      { destination: trip.destination, days: trip.days, budgetType: trip.budgetType, travelersType: trip.travelersType },
      dayNumber,
      instruction
    );

    const idx = trip.itinerary.findIndex(d => d.day === dayNumber);
    if (idx !== -1) trip.itinerary[idx] = newDay;
    else trip.itinerary.push(newDay);

    trip.markModified('itinerary');
    await trip.save();
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Failed to regenerate day. Please try again.' });
  }
});

// POST /api/trips/:id/full-regenerate — re-run all agents with new params
router.post('/:id/full-regenerate', async (req, res) => {
  const { destination, destinationPlaceId, days, budgetType, interests, travelersType } = req.body;

  if (!destination || !days || !budgetType || !travelersType)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const result = await generateTripPlan({ destination, days, budgetType, interests: interests || [], travelersType });

    trip.destination = destination;
    trip.destinationPlaceId = destinationPlaceId || trip.destinationPlaceId;
    trip.days = days;
    trip.budgetType = budgetType;
    trip.interests = interests || [];
    trip.travelersType = travelersType;
    trip.itinerary = result.itinerary;
    trip.hotels = result.hotels;
    trip.restaurants = result.restaurants;
    trip.estimatedBudget = result.estimatedBudget;
    trip.destinationInsights = result.destinationInsights;
    trip.emergencyInfo = result.emergencyInfo;

    await trip.save();
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Failed to regenerate trip. Please try again.' });
  }
});

// POST /api/trips/:id/chat — streaming AI chat with full trip context
router.post('/:id/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'message is required' });

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const systemPrompt = `You are an expert AI travel assistant helping with a specific trip plan. You have full knowledge of this trip and can answer questions, suggest improvements, give packing advice, recommend alternatives, and explain local culture.

TRIP CONTEXT:
- Destination: ${trip.destination}
- Duration: ${trip.days} days
- Budget: ${trip.budgetType}
- Travelers: ${trip.travelersType}
- Interests: ${trip.interests?.join(', ') || 'general'}
- Estimated total budget: ${trip.estimatedBudget?.total || 'not specified'}

ITINERARY SUMMARY:
${trip.itinerary?.map(d => `Day ${d.day} (${d.theme || ''}): ${d.activities?.map(a => a.title).join(', ')}`).join('\n') || 'No itinerary'}

HOTELS: ${trip.hotels?.map(h => h.name).join(', ') || 'none'}
RESTAURANTS: ${trip.restaurants?.map(r => r.name).join(', ') || 'none'}

EMERGENCY INFO:
- General Emergency: ${trip.emergencyInfo?.generalEmergency || 'unknown'}
- Currency: ${trip.emergencyInfo?.localCurrency || 'unknown'}

Be concise, friendly, and specific to THIS trip. Format responses with bullet points when listing multiple items. Never make up specific prices unless they match the trip budget level.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 600,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message || 'Chat failed' })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
