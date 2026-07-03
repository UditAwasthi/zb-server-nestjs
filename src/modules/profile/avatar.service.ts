import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

import { env } from "../../config/env";

@Injectable()
export class AvatarService {
    private readonly supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
            auth: {
                persistSession: false,
            },
        });
    }

    async generateUploadUrl(userId: string) {
        const avatarKey = `avatars/${userId}/${uuidv4()}`;

        // Generate signed upload URL valid for 15 minutes (900 seconds)
        const { data, error } = await this.supabase.storage
            .from(env.SUPABASE_BUCKET)
            .createSignedUploadUrl(avatarKey);

        if (error || !data?.signedUrl) {
            throw new InternalServerErrorException(
                error?.message || "Failed to generate signed upload URL from storage.",
            );
        }

        const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_BUCKET}/${avatarKey}`;

        return {
            uploadUrl: data.signedUrl,
            avatarKey,
            publicUrl,
        };
    }

    async deleteObject(key: string): Promise<void> {
        const { error } = await this.supabase.storage
            .from(env.SUPABASE_BUCKET)
            .remove([key]);

        if (error) {
            throw new InternalServerErrorException(
                `Failed to delete avatar from storage: ${error.message}`,
            );
        }
    }
}
