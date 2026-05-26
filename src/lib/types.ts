export interface HubListing {
  hub_pubkey: string;
  hub_url: string;
  name: string;
  description: string | null;
  icon: string | null;
  invite_only: boolean;
  min_security_level: number;
  invite_code: string | null;
  bio: string;
  tags: string[];
  language: string;
  listed_at: string;
  last_verified_at: string;
}

export interface InfoResponse {
  name: string;
  description?: string | null;
  icon?: string | null;
  version: string;
  public_key: string;
  min_security_level: number;
  invite_only: boolean;
}

export interface SubmitPayload {
  hub_url: string;
  tags: string[];
  language: string;
  bio: string;
  invite_code?: string | null;
  canonical_payload: string;
  hub_pubkey: string;
  signature: string;
}

export interface BotCommand {
  name: string;
  description: string;
}

export interface BotListing {
  pubkey: string;
  name: string;
  description: string;
  homepage_url: string;
  webhook_url: string;
  capabilities: string[];
  commands: BotCommand[];
  tags: string[];
  listed_at: number;
  updated_at: number;
}

export type BotListingInput = Omit<BotListing, "listed_at" | "updated_at">;
