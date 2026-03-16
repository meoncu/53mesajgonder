import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({totalContacts:0,totalGroups:0,activeCampaigns:0,lastSyncAt:null,scheduledCount:0});}
