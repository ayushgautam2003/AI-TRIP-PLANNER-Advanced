'use client';
import {
  Document, Page, Text, View, StyleSheet, Font, pdf,
} from '@react-pdf/renderer';

const VIOLET = '#8b5cf6';
const DARK = '#0f172a';
const CARD = '#1e293b';
const MUTED = '#94a3b8';
const WHITE = '#f8fafc';
const BORDER = '#334155';

const styles = StyleSheet.create({
  page: {
    backgroundColor: DARK,
    fontFamily: 'Helvetica',
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },

  // Header
  header: { marginBottom: 28 },
  headerBadge: {
    backgroundColor: VIOLET,
    color: WHITE,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    marginBottom: 6,
  },
  subtitle: { fontSize: 11, color: MUTED, marginBottom: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  pillViolet: { backgroundColor: '#3b1f6e', color: VIOLET },
  pillSlate: { backgroundColor: BORDER, color: MUTED },
  pillSky: { backgroundColor: '#0c2440', color: '#38bdf8' },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 18 },

  // Section heading
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Budget
  budgetGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  budgetCell: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  budgetLabel: { fontSize: 8, color: MUTED, marginBottom: 3 },
  budgetValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: WHITE },
  budgetTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: VIOLET,
  },
  budgetTotalLabel: { fontSize: 11, color: MUTED },
  budgetTotalValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: VIOLET },

  // Hotel card
  hotelCard: {
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hotelName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 2 },
  hotelMeta: { fontSize: 9, color: MUTED },
  hotelPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: VIOLET },

  // Restaurant card
  restCard: {
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  restName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 2 },
  restMeta: { fontSize: 9, color: MUTED },

  // Day card
  dayCard: {
    backgroundColor: CARD,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  dayHeader: {
    backgroundColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  dayBadge: {
    backgroundColor: VIOLET,
    color: WHITE,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    paddingTop: 5,
  },
  dayTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE },
  dayTheme: { fontSize: 9, color: MUTED },

  // Activity
  activityRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2744',
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VIOLET,
    marginTop: 3,
    flexShrink: 0,
  },
  activityContent: { flex: 1 },
  activityTime: { fontSize: 8, color: VIOLET, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  activityTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 2 },
  activityDesc: { fontSize: 9, color: MUTED, lineHeight: 1.5 },
  activityMetaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  activityMeta: { fontSize: 8, color: '#64748b' },

  // Emergency
  emergencyCard: {
    backgroundColor: '#1a0a0a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    marginBottom: 6,
  },
  emergencyTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fca5a5', marginBottom: 6 },
  emergencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  emergencyLabel: { fontSize: 9, color: '#f87171' },
  emergencyValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: WHITE },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: '#475569' },
  pageNumber: { fontSize: 8, color: '#475569' },
});

function TripDocument({ trip }) {
  const budgetLabel = { low: 'Budget', medium: 'Moderate', high: 'Luxury' };

  return (
    <Document title={`${trip.destination} Trip Plan`} author="AI Trip Planner">

      {/* ── PAGE 1: Overview ── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBadge}>AI TRIP PLANNER</Text>
          <Text style={styles.title}>{trip.destination}</Text>
          <Text style={styles.subtitle}>
            Generated on {new Date(trip.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.pillRow}>
            <Text style={[styles.pill, styles.pillViolet]}>{trip.days} Day{trip.days > 1 ? 's' : ''}</Text>
            <Text style={[styles.pill, styles.pillViolet]}>{budgetLabel[trip.budgetType] || trip.budgetType}</Text>
            <Text style={[styles.pill, styles.pillSlate]}>{trip.travelersType}</Text>
            {trip.interests?.map(i => (
              <Text key={i} style={[styles.pill, styles.pillSky]}>{i}</Text>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Destination Overview */}
        {trip.destinationInsights?.overview && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>About the Destination</Text>
            <Text style={{ fontSize: 10, color: MUTED, lineHeight: 1.7 }}>
              {trip.destinationInsights.overview}
            </Text>
          </View>
        )}

        {/* Budget */}
        {trip.estimatedBudget && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Estimated Budget</Text>
            <View style={styles.budgetGrid}>
              {[
                ['Flights', trip.estimatedBudget.flights],
                ['Accommodation', trip.estimatedBudget.accommodation],
                ['Food', trip.estimatedBudget.food],
                ['Activities', trip.estimatedBudget.activities],
              ].filter(([, v]) => v).map(([label, value]) => (
                <View key={label} style={styles.budgetCell}>
                  <Text style={styles.budgetLabel}>{label}</Text>
                  <Text style={styles.budgetValue}>{value}</Text>
                </View>
              ))}
            </View>
            {trip.estimatedBudget.total && (
              <View style={styles.budgetTotal}>
                <Text style={styles.budgetTotalLabel}>Total Estimated Cost</Text>
                <Text style={styles.budgetTotalValue}>{trip.estimatedBudget.total}</Text>
              </View>
            )}
          </View>
        )}

        {/* Hotels */}
        {trip.hotels?.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Recommended Hotels</Text>
            {trip.hotels.slice(0, 3).map((hotel, i) => (
              <View key={i} style={styles.hotelCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotelName}>{hotel.name}</Text>
                  <Text style={styles.hotelMeta}>{hotel.type} · ★ {hotel.rating}</Text>
                  {hotel.amenities?.length > 0 && (
                    <Text style={[styles.hotelMeta, { marginTop: 3 }]}>{hotel.amenities.slice(0, 3).join(' · ')}</Text>
                  )}
                </View>
                <Text style={styles.hotelPrice}>{hotel.pricePerNight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Emergency Info */}
        {trip.emergencyInfo && (
          <View>
            <Text style={styles.sectionTitle}>Emergency Information</Text>
            <View style={styles.emergencyCard}>
              <Text style={styles.emergencyTitle}>Emergency Contacts · {trip.destination}</Text>
              {[
                ['General Emergency', trip.emergencyInfo.generalEmergency],
                ['Police', trip.emergencyInfo.police],
                ['Ambulance', trip.emergencyInfo.ambulance],
                ['Fire', trip.emergencyInfo.fire],
              ].filter(([, v]) => v).map(([label, val]) => (
                <View key={label} style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>{label}</Text>
                  <Text style={styles.emergencyValue}>{val}</Text>
                </View>
              ))}
              {trip.emergencyInfo.localCurrency && (
                <Text style={[styles.emergencyLabel, { marginTop: 6 }]}>
                  Currency: {trip.emergencyInfo.localCurrency} {trip.emergencyInfo.currencyCode ? `(${trip.emergencyInfo.currencyCode})` : ''}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AI Trip Planner · {trip.destination}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ── PAGE 2+: Itinerary (one day per section) ── */}
      <Page size="A4" style={styles.page}>
        <Text style={[styles.title, { fontSize: 20, marginBottom: 16 }]}>Day-by-Day Itinerary</Text>

        {trip.itinerary?.map((day) => (
          <View key={day.day} style={styles.dayCard} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayBadge}>{day.day}</Text>
              <View>
                <Text style={styles.dayTitle}>Day {day.day}</Text>
                {day.theme && <Text style={styles.dayTheme}>{day.theme}</Text>}
              </View>
            </View>
            {day.activities?.map((act, i) => (
              <View key={i} style={[styles.activityRow, i === day.activities.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  {act.time && <Text style={styles.activityTime}>{act.time}</Text>}
                  <Text style={styles.activityTitle}>{act.title}</Text>
                  {act.description && (
                    <Text style={styles.activityDesc}>{act.description}</Text>
                  )}
                  <View style={styles.activityMetaRow}>
                    {act.ticketPrice && <Text style={styles.activityMeta}>🎟 {act.ticketPrice}</Text>}
                    {act.rating && <Text style={styles.activityMeta}>★ {act.rating}</Text>}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Restaurants on last itinerary page */}
        {trip.restaurants?.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Must-Try Restaurants</Text>
            {trip.restaurants.map((r, i) => (
              <View key={i} style={styles.restCard}>
                <Text style={styles.restName}>{r.name}</Text>
                <Text style={styles.restMeta}>
                  {r.cuisine} · ★ {r.rating} · {r.priceRange}
                  {r.specialty ? ` · ${r.specialty}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AI Trip Planner · {trip.destination}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

    </Document>
  );
}

export async function downloadTripPDF(trip) {
  const blob = await pdf(<TripDocument trip={trip} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.destination.replace(/[^a-z0-9]/gi, '-')}-trip-plan.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
