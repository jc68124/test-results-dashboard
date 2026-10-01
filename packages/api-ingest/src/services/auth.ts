import type { AppCtx } from '../types';

export async function verifyProjectIngestionSecret<TD1Binding extends string>(
    ctx: AppCtx<TD1Binding>,
    projectPublicId: string,
    providedSecret: string,
): Promise<boolean> {
    const { db } = ctx;

    const hashedProvidedSecret = await hashApiKey(providedSecret);

    const matchingKey = await db.ingestKey.findFirst({
        where: {
            keyHash: hashedProvidedSecret,
            project: {
                publicId: projectPublicId,
            },
        }
    });

    if (!matchingKey) {
        return false;
    }

    // Check if the key is expired or revoked
    const now = new Date();
    if ((matchingKey.expiresAt && matchingKey.expiresAt <= now) || (matchingKey.revokedAt && matchingKey.revokedAt <= now)) {
        return false;
    }

    // Update lastUsedAt periodically to avoid a write on every ingest request.
    if (
        !matchingKey.lastUsedAt ||
        matchingKey.lastUsedAt.getTime() < now.getTime() - 5 * 60 * 1000
    ) {
        try {
            await db.ingestKey.update({
                where: { id: matchingKey.id },
                data: { lastUsedAt: now },
            });
        } catch (error) {
            console.error('Failed to update lastUsedAt for ingest key:', error);
        }
    }

    return true;
}

async function hashApiKey(apiKey: string): Promise<string> {
	const encoded = new TextEncoder().encode(apiKey);
	const digest = await crypto.subtle.digest('SHA-256', encoded);

	return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = '';

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}