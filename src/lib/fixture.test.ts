import { describe, it, expect } from 'vitest';
import { MATCHES } from './data';

// Content-based verification of the REAL fixture (order-independent): every
// match from the official listing must exist exactly once with the right
// home/away orientation, Colombia date+time, and venue. Ids are mapped to
// historical pairings (bet preservation), so we match by content, not order.
// Format: [home, away, 'MM-DDTHH:MM', venue fragment]
const OFFICIAL: Record<string, [string, string, string, string][]> = {
  A: [
    ['Mexico', 'South Africa', '06-11T14:00', 'Ciudad de México'],
    ['Korea Republic', 'Czechia', '06-11T21:00', 'Guadalajara'],
    ['Czechia', 'South Africa', '06-18T11:00', 'Atlanta'],
    ['Mexico', 'Korea Republic', '06-18T22:00', 'Guadalajara'],
    ['South Africa', 'Korea Republic', '06-24T20:00', 'Monterrey'],
    ['Czechia', 'Mexico', '06-24T20:00', 'Ciudad de México'],
  ],
  B: [
    ['Canada', 'Bosnia and Herzegovina', '06-12T14:00', 'Toronto'],
    ['Qatar', 'Switzerland', '06-13T14:00', 'San Francisco'],
    ['Switzerland', 'Bosnia and Herzegovina', '06-18T18:00', 'Los Ángeles'],
    ['Canada', 'Qatar', '06-18T21:00', 'Vancouver'],
    ['Bosnia and Herzegovina', 'Qatar', '06-24T18:00', 'Seattle'],
    ['Switzerland', 'Canada', '06-24T18:00', 'Vancouver'],
  ],
  C: [
    ['Brazil', 'Morocco', '06-13T17:00', 'Nueva York'],
    ['Haiti', 'Scotland', '06-13T20:00', 'Boston'],
    ['Scotland', 'Morocco', '06-19T18:00', 'Boston'],
    ['Brazil', 'Haiti', '06-19T20:30', 'Toronto'],
    ['Morocco', 'Haiti', '06-24T23:00', 'Atlanta'],
    ['Scotland', 'Brazil', '06-24T23:00', 'Miami'],
  ],
  D: [
    ['USA', 'Paraguay', '06-12T20:00', 'Los Ángeles'],
    ['Australia', 'Türkiye', '06-13T23:00', 'Vancouver'],
    ['USA', 'Australia', '06-19T14:00', 'Seattle'],
    ['Türkiye', 'Paraguay', '06-19T21:00', 'San Francisco'],
    ['Paraguay', 'Australia', '06-26T22:00', 'Houston'],
    ['Türkiye', 'USA', '06-26T22:00', 'Vancouver'],
  ],
  E: [
    ['Germany', 'Curaçao', '06-14T12:00', 'Houston'],
    ["Côte d'Ivoire", 'Ecuador', '06-14T18:00', 'Filadelfia'],
    ['Germany', "Côte d'Ivoire", '06-20T15:00', 'Toronto'],
    ['Ecuador', 'Curaçao', '06-20T19:00', 'Kansas City'],
    ['Curaçao', "Côte d'Ivoire", '06-25T15:00', 'Boston'],
    ['Ecuador', 'Germany', '06-25T15:00', 'Nueva York'],
  ],
  F: [
    ['Netherlands', 'Japan', '06-14T15:00', 'Dallas'],
    ['Sweden', 'Tunisia', '06-14T21:00', 'Monterrey'],
    ['Netherlands', 'Sweden', '06-20T12:00', 'Houston'],
    ['Tunisia', 'Japan', '06-20T22:00', 'Monterrey'],
    ['Japan', 'Sweden', '06-25T19:00', 'Dallas'],
    ['Tunisia', 'Netherlands', '06-25T19:00', 'Atlanta'],
  ],
  G: [
    ['Belgium', 'Egypt', '06-15T14:00', 'Seattle'],
    ['IR Iran', 'New Zealand', '06-15T20:00', 'Los Ángeles'],
    ['Belgium', 'IR Iran', '06-21T18:00', 'Los Ángeles'],
    ['New Zealand', 'Egypt', '06-21T21:00', 'Vancouver'],
    ['Egypt', 'IR Iran', '06-26T23:00', 'Seattle'],
    ['New Zealand', 'Belgium', '06-26T23:00', 'Vancouver'],
  ],
  H: [
    ['Spain', 'Cabo Verde', '06-15T11:00', 'Atlanta'],
    ['Saudi Arabia', 'Uruguay', '06-15T17:00', 'Miami'],
    ['Spain', 'Saudi Arabia', '06-21T12:00', 'Atlanta'],
    ['Uruguay', 'Cabo Verde', '06-21T17:00', 'Miami'],
    ['Cabo Verde', 'Saudi Arabia', '06-26T20:00', 'Houston'],
    ['Uruguay', 'Spain', '06-26T20:00', 'Guadalajara'],
  ],
  I: [
    ['France', 'Senegal', '06-16T14:00', 'Nueva York'],
    ['Iraq', 'Norway', '06-16T17:00', 'Boston'],
    ['France', 'Iraq', '06-22T17:00', 'Filadelfia'],
    ['Norway', 'Senegal', '06-22T20:00', 'Nueva York'],
    ['Senegal', 'Iraq', '06-26T15:00', 'Toronto'],
    ['Norway', 'France', '06-26T15:00', 'Boston'],
  ],
  J: [
    ['Argentina', 'Algeria', '06-16T20:00', 'Kansas City'],
    ['Austria', 'Jordan', '06-16T23:00', 'San Francisco'],
    ['Argentina', 'Austria', '06-22T18:00', 'Dallas'],
    ['Jordan', 'Algeria', '06-22T21:00', 'San Francisco'],
    ['Algeria', 'Austria', '06-27T22:00', 'Dallas'],
    ['Jordan', 'Argentina', '06-27T22:00', 'San Francisco'],
  ],
  K: [
    ['Portugal', 'Congo DR', '06-17T12:00', 'Houston'],
    ['Uzbekistan', 'Colombia', '06-17T21:00', 'Ciudad de México'],
    ['Portugal', 'Uzbekistan', '06-23T18:00', 'Guadalajara'],
    ['Colombia', 'Congo DR', '06-23T21:00', 'Ciudad de México'],
    ['Congo DR', 'Uzbekistan', '06-27T19:30', 'Atlanta'],
    ['Colombia', 'Portugal', '06-27T19:30', 'Miami'],
  ],
  // Group L intentionally absent: the source listing was corrupted, so its
  // days follow the source's prose notes and hours are estimates.
};

describe('fixture vs official listing (content-based, order-independent)', () => {
  for (const [g, official] of Object.entries(OFFICIAL)) {
    it(`group ${g}: all 6 matches with exact teams, date/time (COL) and venue`, () => {
      const inData = MATCHES.filter(m => m.group === g);
      expect(inData.length).toBe(6);
      const missing: string[] = [];
      for (const [home, away, dt, venue] of official) {
        const hit = inData.find(m =>
          m.home === home && m.away === away && m.date === `2026-${dt}` && m.venue.includes(venue));
        if (!hit) missing.push(`${home} vs ${away} | ${dt} | ${venue}`);
      }
      expect(missing, `Faltan o difieren en grupo ${g}:\n${missing.join('\n')}`).toEqual([]);
    });
  }

  it('opening day (11 jun) has exactly the 2 official matches', () => {
    const day1 = MATCHES.filter(m => m.date.startsWith('2026-06-11'));
    expect(day1.length).toBe(2);
    expect(day1.some(m => m.home === 'Mexico' && m.away === 'South Africa' && m.date.endsWith('14:00'))).toBe(true);
    expect(day1.some(m => m.home === 'Korea Republic' && m.away === 'Czechia' && m.date.endsWith('21:00'))).toBe(true);
  });
});
