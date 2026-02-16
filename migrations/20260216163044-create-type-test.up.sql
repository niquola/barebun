CREATE TABLE public.type_test (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Integers
  col_smallint  SMALLINT,
  col_integer   INTEGER,
  col_bigint    BIGINT,
  col_serial    INTEGER NOT NULL DEFAULT 0,

  -- Floating point
  col_real      REAL,
  col_double    DOUBLE PRECISION,
  col_numeric   NUMERIC(12, 4),
  col_money     MONEY,

  -- Boolean
  col_bool      BOOLEAN NOT NULL DEFAULT false,

  -- Text
  col_text      TEXT NOT NULL,
  col_varchar   CHARACTER VARYING(255),
  col_char      CHARACTER(10),

  -- Binary
  col_bytea     BYTEA,

  -- Date/time
  col_timestamp TIMESTAMP WITHOUT TIME ZONE,
  col_timestamptz TIMESTAMP WITH TIME ZONE,
  col_date      DATE,
  col_interval  INTERVAL,

  -- UUID
  col_uuid      UUID,

  -- JSON
  col_json      JSON,
  col_jsonb     JSONB,

  -- Arrays
  col_text_arr     TEXT[],
  col_int_arr      INTEGER[],
  col_date_arr     DATE[],
  col_timestamptz_arr TIMESTAMPTZ[],
  col_interval_arr INTERVAL[],
  col_uuid_arr     UUID[],
  col_bool_arr     BOOLEAN[],

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.type_test.col_jsonb IS '{ key: string; value: number }';
