-- SCIM 2.0 User Resource (RFC 7643)

CREATE TABLE users (
  -- Core: server-assigned id + client externalId
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT UNIQUE,
  user_name     TEXT NOT NULL UNIQUE,

  -- Name (complex type → JSONB)
  name          JSONB,
  display_name  TEXT,
  nick_name     TEXT,
  profile_url   TEXT,

  -- Contact
  emails        JSONB,
  phone_numbers JSONB,
  ims           JSONB,
  photos        JSONB,
  addresses     JSONB,

  -- Org
  title         TEXT,
  user_type     TEXT,
  roles         JSONB,
  entitlements  JSONB,

  -- Locale
  preferred_language TEXT,
  locale        TEXT,
  timezone      TEXT,

  -- Status
  active        BOOLEAN NOT NULL DEFAULT true,
  password      TEXT,

  -- Groups (read-only in SCIM, managed via group membership)
  groups        JSONB,

  -- x509
  x509_certificates JSONB,

  -- Meta (RFC 7643 §3.1)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  version       TEXT
);

-- JSONB column types (read by codegen → TypeScript types)
COMMENT ON COLUMN users.name IS '{ givenName?: string; familyName?: string; middleName?: string; formatted?: string; honorificPrefix?: string; honorificSuffix?: string }';
COMMENT ON COLUMN users.emails IS '{ value: string; type?: string; primary?: boolean }[]';
COMMENT ON COLUMN users.phone_numbers IS '{ value: string; type?: string }[]';
COMMENT ON COLUMN users.ims IS '{ value: string; type?: string }[]';
COMMENT ON COLUMN users.photos IS '{ value: string; type?: string }[]';
COMMENT ON COLUMN users.addresses IS '{ formatted?: string; streetAddress?: string; locality?: string; region?: string; postalCode?: string; country?: string; type?: string }[]';
COMMENT ON COLUMN users.roles IS '{ value: string; type?: string; primary?: boolean }[]';
COMMENT ON COLUMN users.entitlements IS '{ value: string; type?: string }[]';
COMMENT ON COLUMN users.groups IS '{ value: string; display?: string; type?: string }[]';
COMMENT ON COLUMN users.x509_certificates IS '{ value: string; type?: string }[]';
