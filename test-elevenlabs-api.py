#!/usr/bin/env python3
"""
Quick diagnostic script to test ElevenLabs API connection
Run this locally or in Railway to verify API key and voice IDs work
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def test_elevenlabs():
    """Test ElevenLabs API connectivity and configuration"""

    print("=" * 60)
    print("ElevenLabs API Diagnostic Test")
    print("=" * 60)
    print()

    # Check environment variables
    print("1. Checking environment variables...")

    eleven_api_key = os.getenv("ELEVEN_API_KEY")
    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id_tax = os.getenv("ELEVENLABS_VOICE_ID")

    if not eleven_api_key and not elevenlabs_api_key:
        print("   ❌ FAIL: No API key found")
        print("   Missing: ELEVEN_API_KEY (required by LiveKit plugin)")
        print("   Set in Railway: ELEVEN_API_KEY=sk_your_key_here")
        return False

    # Determine which key to use
    api_key = eleven_api_key or elevenlabs_api_key
    key_name = "ELEVEN_API_KEY" if eleven_api_key else "ELEVENLABS_API_KEY"

    print(f"   ✅ Found API key: {key_name}")
    print(f"   Key format: {api_key[:8]}...{api_key[-4:] if len(api_key) > 12 else ''}")

    if not eleven_api_key:
        print("   ⚠️  WARNING: Using ELEVENLABS_API_KEY but plugin needs ELEVEN_API_KEY")
        print("   Add to Railway: ELEVEN_API_KEY=<your_key>")

    print()

    # Check voice IDs
    print("2. Checking voice ID configuration...")
    if voice_id_tax:
        print(f"   ✅ Tax voice ID: {voice_id_tax}")
    else:
        print("   ⚠️  No ELEVENLABS_VOICE_ID set (will use default)")
    print()

    # Test API connection
    print("3. Testing API connection...")

    try:
        import httpx

        headers = {"xi-api-key": api_key}

        # Test 1: List voices
        print("   Testing: GET /v1/voices")
        with httpx.Client() as client:
            response = client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 200:
                voices = response.json().get("voices", [])
                print(f"   ✅ Success! Found {len(voices)} voices")

                # Show first few voice names
                if voices:
                    print("\n   Available voices:")
                    for voice in voices[:5]:
                        print(f"      - {voice.get('name')}: {voice.get('voice_id')}")
                    if len(voices) > 5:
                        print(f"      ... and {len(voices) - 5} more")

            elif response.status_code == 401:
                print("   ❌ FAIL: API key unauthorized")
                print("   Check: Is your API key valid?")
                print("   Check: Did you copy it correctly?")
                return False
            else:
                print(f"   ❌ FAIL: HTTP {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False

        print()

        # Test 2: Check specific voice ID if provided
        if voice_id_tax:
            print(f"   Testing: GET /v1/voices/{voice_id_tax}")
            with httpx.Client() as client:
                response = client.get(
                    f"https://api.elevenlabs.io/v1/voices/{voice_id_tax}",
                    headers=headers,
                    timeout=10.0
                )

                if response.status_code == 200:
                    voice_data = response.json()
                    print(f"   ✅ Voice found: {voice_data.get('name')}")
                    print(f"   Voice ID: {voice_data.get('voice_id')}")
                elif response.status_code == 404:
                    print(f"   ❌ FAIL: Voice ID not found")
                    print(f"   Check: Is {voice_id_tax} correct?")
                    print("   Verify at: https://elevenlabs.io/app/voice-library")
                    return False
                else:
                    print(f"   ⚠️  WARNING: HTTP {response.status_code}")
                    print(f"   Response: {response.text[:200]}")

        print()

        # Test 3: Check account info
        print("   Testing: GET /v1/user")
        with httpx.Client() as client:
            response = client.get(
                "https://api.elevenlabs.io/v1/user",
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 200:
                user_data = response.json()
                subscription = user_data.get("subscription", {})
                print(f"   ✅ Account active")
                print(f"   Tier: {subscription.get('tier', 'unknown')}")

                # Check character usage
                char_count = subscription.get("character_count", 0)
                char_limit = subscription.get("character_limit", 0)
                if char_limit > 0:
                    usage_pct = (char_count / char_limit) * 100
                    print(f"   Usage: {char_count:,} / {char_limit:,} characters ({usage_pct:.1f}%)")

                    if usage_pct > 90:
                        print("   ⚠️  WARNING: Near quota limit!")
            else:
                print(f"   ⚠️  Could not fetch account info: HTTP {response.status_code}")

        print()
        print("=" * 60)
        print("✅ All tests passed! ElevenLabs API is working.")
        print("=" * 60)
        print()
        print("Configuration for Railway:")
        print("-" * 60)
        print(f"ELEVEN_API_KEY={api_key}")
        if voice_id_tax:
            print(f"ELEVENLABS_VOICE_ID={voice_id_tax}")
        print("-" * 60)

        return True

    except ImportError:
        print("   ❌ FAIL: httpx not installed")
        print("   Install: pip install httpx")
        return False
    except Exception as e:
        print(f"   ❌ FAIL: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    success = test_elevenlabs()
    sys.exit(0 if success else 1)
