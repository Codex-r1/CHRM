// app/api/orders/shipping/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

// DHL shipping zones and rates
const SHIPPING_RATES = {
  // From Nairobi hub to destinations
  'dhl_express': {
    'Kenya': { price: 10, time: '1-2 business days', description: 'Same country delivery' },
    'East Africa': { price: 25, time: '2-3 business days', description: 'Uganda, Tanzania, Rwanda' },
    'Africa': { price: 35, time: '3-5 business days', description: 'Rest of Africa' },
    'Europe': { price: 45, time: '2-4 business days', description: 'UK, Germany, France' },
    'North America': { price: 55, time: '3-5 business days', description: 'USA, Canada' },
    'Asia': { price: 50, time: '3-5 business days', description: 'China, Japan, India' },
    'Rest of World': { price: 60, time: '4-6 business days', description: 'Other destinations' }
  },
  'dhl_economy': {
    'Kenya': { price: 8, time: '2-3 business days', description: 'Same country delivery' },
    'East Africa': { price: 18, time: '3-5 business days', description: 'Uganda, Tanzania, Rwanda' },
    'Africa': { price: 25, time: '5-7 business days', description: 'Rest of Africa' },
    'Europe': { price: 35, time: '4-7 business days', description: 'UK, Germany, France' },
    'North America': { price: 40, time: '5-8 business days', description: 'USA, Canada' },
    'Asia': { price: 35, time: '5-8 business days', description: 'China, Japan, India' },
    'Rest of World': { price: 45, time: '6-9 business days', description: 'Other destinations' }
  }
};

// Helper to determine region based on country
function getRegion(country: string): string {
  const eastAfrica = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Ethiopia'];
  const africa = ['Nigeria', 'South Africa', 'Egypt', 'Ghana', 'Senegal', 'Morocco', 'Algeria'];
  const europe = ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Belgium', 'Switzerland', 'Austria'];
  const northAmerica = ['United States', 'Canada', 'Mexico'];
  const asia = ['China', 'Japan', 'India', 'South Korea', 'Singapore', 'Malaysia', 'UAE', 'Saudi Arabia'];
  
  if (eastAfrica.includes(country)) return 'East Africa';
  if (africa.includes(country)) return 'Africa';
  if (europe.includes(country)) return 'Europe';
  if (northAmerica.includes(country)) return 'North America';
  if (asia.includes(country)) return 'Asia';
  return 'Rest of World';
}

export async function POST(request: Request) {
  try {
    const { country, shippingMethod, items } = await request.json();
    
    const region = getRegion(country);
    const rates = SHIPPING_RATES[shippingMethod as keyof typeof SHIPPING_RATES];
    
    if (!rates) {
      return NextResponse.json(
        { error: 'Invalid shipping method' },
        { status: 400 }
      );
    }
    
    const rate = rates[region as keyof typeof rates];
    
    if (!rate) {
      return NextResponse.json(
        { error: 'Shipping not available for this destination' },
        { status: 400 }
      );
    }
    
    // Calculate weight-based pricing if needed
    // For now, just return the base rate
    
    return NextResponse.json({
      success: true,
      shipping: {
        method: shippingMethod,
        region: region,
        price: rate.price,
        time: rate.time,
        description: rate.description,
        // Add tracking info
        carrier: 'DHL',
        tracking_url: 'https://www.dhl.com/global-en/home/tracking.html',
        pickup_location: 'Nairobi, Kenya', // DHL pickup hub
        origin: 'Nakuru, Kenya → Nairobi Hub'
      }
    });
    
  } catch (error: any) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}