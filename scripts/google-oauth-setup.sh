#!/usr/bin/env bash
# Fetches Google OAuth credentials from GCP Secret Manager and saves to .env
#
# Standard Google Sign-In OAuth clients (*.apps.googleusercontent.com) cannot
# be created via CLI/API — only through the GCP Console. This script fetches
# credentials that were stored in Secret Manager after manual creation.
#
# First-time setup (one person does this once):
#   1. https://console.cloud.google.com/apis/credentials?project=atomic-ehr
#   2. + CREATE CREDENTIALS > OAuth client ID > Web application
#   3. Name: iglite-dev
#   4. Authorized JavaScript origins: http://localhost:30555
#   5. Authorized redirect URIs: http://localhost:30555/auth/google/callback
#   6. Save client_id and client_secret to Secret Manager:
#      bash scripts/google-oauth-setup.sh --save <CLIENT_ID> <CLIENT_SECRET>
#
# Team usage (everyone else):
#   bash scripts/google-oauth-setup.sh
#
set -euo pipefail

PROJECT="${GCP_PROJECT:-atomic-ehr}"
SECRET_NAME="${GOOGLE_SECRET_NAME:-iglite-google-oauth}"
ENV_FILE=".env"

# -- save mode: store credentials in Secret Manager --
if [[ "${1:-}" == "--save" ]]; then
  if [[ $# -lt 3 ]]; then
    echo "Usage: $0 --save <CLIENT_ID> <CLIENT_SECRET>"
    exit 1
  fi
  CLIENT_ID="$2"
  CLIENT_SECRET="$3"
  PAYLOAD=$(printf '{"client_id":"%s","client_secret":"%s"}' "$CLIENT_ID" "$CLIENT_SECRET")

  # Create secret if it doesn't exist
  if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT" &>/dev/null; then
    gcloud secrets create "$SECRET_NAME" --project="$PROJECT" --replication-policy=automatic
    echo "Created secret: $SECRET_NAME"
  fi

  echo -n "$PAYLOAD" | gcloud secrets versions add "$SECRET_NAME" --project="$PROJECT" --data-file=-
  echo "Stored credentials in $PROJECT/$SECRET_NAME"
  exit 0
fi

# -- fetch mode: get credentials from Secret Manager and save to .env --
command -v gcloud &>/dev/null || { echo "Error: gcloud not found"; exit 1; }

echo "Fetching Google OAuth credentials from $PROJECT/$SECRET_NAME..."

JSON=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT" 2>&1) || {
  echo "Error: could not read secret '$SECRET_NAME' from project '$PROJECT'"
  echo ""
  echo "Either the secret doesn't exist yet, or you lack access."
  echo "To create it, see: bash $0 --save <CLIENT_ID> <CLIENT_SECRET>"
  exit 1
}

# Parse JSON — handle both {client_id, client_secret} and {installed: {client_id, client_secret}} formats
CLIENT_ID=$(echo "$JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'installed' in d: d = d['installed']
if 'web' in d: d = d['web']
print(d['client_id'])
" 2>/dev/null) || { echo "Error: cannot parse secret JSON"; exit 1; }

CLIENT_SECRET=$(echo "$JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'installed' in d: d = d['installed']
if 'web' in d: d = d['web']
print(d['client_secret'])
" 2>/dev/null) || { echo "Error: cannot parse secret JSON"; exit 1; }

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "Error: client_id or client_secret is empty in secret"
  exit 1
fi

echo "Client ID: ${CLIENT_ID}"

# Save to .env
[[ -f "$ENV_FILE" ]] || cp .env.example "$ENV_FILE"

tmp=$(mktemp)
grep -v '^GOOGLE_CLIENT_ID=' "$ENV_FILE" | grep -v '^GOOGLE_CLIENT_SECRET=' > "$tmp" || true
echo "GOOGLE_CLIENT_ID=${CLIENT_ID}" >> "$tmp"
echo "GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}" >> "$tmp"
mv "$tmp" "$ENV_FILE"

echo "Saved to $ENV_FILE"
