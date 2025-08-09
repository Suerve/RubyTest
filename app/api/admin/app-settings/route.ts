
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    // Try to get existing settings or create default ones
    let settings = await prisma.app_settings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.app_settings.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          twoFactorEnabled: false,
          customSignatureEnabled: false,
          testPausingEnabled: true,
          pdfDownloadEnabled: true,
          practiceTestEnabled: true,
        },
      });
    }

    return NextResponse.json({ 
      settings: {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching app settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch app settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = await request.json();

    const {
      twoFactorEnabled,
      customSignatureEnabled,
      signatureName,
      signatureTitle,
      signatureImage,
      testPausingEnabled,
      pdfDownloadEnabled,
      practiceTestEnabled,
    } = data;

    // Validate required fields when custom signature is enabled
    if (customSignatureEnabled && !signatureName && !signatureTitle && !signatureImage) {
      return NextResponse.json(
        { message: 'Custom signature requires at least a name, title, or image' },
        { status: 400 }
      );
    }

    // Get existing settings or create if none exist
    let settings = await prisma.app_settings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.app_settings.update({
        where: { id: settings.id },
        data: {
          twoFactorEnabled: Boolean(twoFactorEnabled),
          customSignatureEnabled: Boolean(customSignatureEnabled),
          signatureName: customSignatureEnabled ? (signatureName || null) : null,
          signatureTitle: customSignatureEnabled ? (signatureTitle || null) : null,
          signatureImage: customSignatureEnabled ? (signatureImage || null) : null,
          testPausingEnabled: Boolean(testPausingEnabled),
          pdfDownloadEnabled: Boolean(pdfDownloadEnabled),
          practiceTestEnabled: Boolean(practiceTestEnabled),
        },
      });
    } else {
      // Create new settings
      settings = await prisma.app_settings.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          twoFactorEnabled: Boolean(twoFactorEnabled),
          customSignatureEnabled: Boolean(customSignatureEnabled),
          signatureName: customSignatureEnabled ? (signatureName || null) : null,
          signatureTitle: customSignatureEnabled ? (signatureTitle || null) : null,
          signatureImage: customSignatureEnabled ? (signatureImage || null) : null,
          testPausingEnabled: Boolean(testPausingEnabled),
          pdfDownloadEnabled: Boolean(pdfDownloadEnabled),
          practiceTestEnabled: Boolean(practiceTestEnabled),
        },
      });
    }

    // Log admin action
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminUserId: admin.id,
        action: 'SETTINGS_UPDATED',
        details: {
          twoFactorEnabled,
          customSignatureEnabled,
          testPausingEnabled,
          pdfDownloadEnabled,
          practiceTestEnabled,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error updating app settings:', error);
    return NextResponse.json(
      { message: 'Failed to update app settings' },
      { status: 500 }
    );
  }
}
