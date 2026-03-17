import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthClient } from '@/lib/integrations/google-auth';
import { GooglePeopleSyncService } from '@/server/integrations/google/people-sync-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Code not found' }, { status: 400 });
  }

  try {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('Access token not received');
    }

    // Hemen senkronizasyonu başlat (Demo amaçlı)
    // Gerçek uygulamada kullanıcı ID'si session'dan alınmalı
    try {
      const syncService = new GooglePeopleSyncService();
      const result = await syncService.runFullSync('meoncu@gmail.com', tokens.access_token);

      // Senkronizasyon bittikten sonra ana sayfaya veya sync sayfasına dön
      return NextResponse.redirect(new URL('/sync?status=success&created=' + result.created, request.url));
    } catch (error: any) {
      console.error('Google Sync Error Detail:', {
        message: error.message,
        response: error.response?.data,
        errors: error.response?.data?.error?.errors
      });
      throw error; // Re-throw to be caught by the outer catch block
    }
  } catch (error: any) {
    console.error('Callback Error Detail:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.redirect(new URL('/sync?status=error', request.url));
  }
}
