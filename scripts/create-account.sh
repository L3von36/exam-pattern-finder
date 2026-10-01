#!/usr/bin/env bash
# Create a fresh temari.et account with a random Ethiopian phone number.
# Usage: bash create-account.sh <number> <name>
# Saves session to /home/z/my-project/scripts/temari-session<number>.json
# This script handles all the timing carefully to avoid stale ref issues.

NUM="$1"
NAME="${2:-User_$NUM}"
ROOT=/home/z/my-project
SESSION_FILE="$ROOT/scripts/temari-session${NUM}.json"
ACCOUNT_FILE="$ROOT/scripts/account${NUM}.txt"

# Generate random Ethiopian phone number
PHONE=$(python3 -c "
import random
print(random.choice(['091','092','093','094','097','099']) + ''.join([str(random.randint(0,9)) for _ in range(7)]))
")
PIN="5156"

echo "Creating account $NUM: phone=$PHONE name=$NAME"

# Close browser, wait
agent-browser close 2>&1 | tail -1
sleep 3

# Open signup page, wait for it to fully render
agent-browser open "https://temari.et/signup" 2>&1 | tail -1
sleep 5
agent-browser wait --text "Create your account" --timeout 15000 2>&1 | tail -1
sleep 2

# Get fresh refs by re-snapshotting
agent-browser snapshot -i 2>&1 > /tmp/snap.txt
PHONE_REF=$(grep 'textbox "Phone number"' /tmp/snap.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
NAME_REF=$(grep 'textbox "Full name"' /tmp/snap.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
PIN_REF=$(grep 'textbox "PIN"' /tmp/snap.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
SWITCH_REF=$(grep 'switch \[checked=false' /tmp/snap.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
BTN_REF=$(grep 'button "Create account"' /tmp/snap.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)

echo "Refs: phone=$PHONE_REF name=$NAME_REF pin=$PIN_REF switch=$SWITCH_REF btn=$BTN_REF"

if [ -z "$PHONE_REF" ] || [ -z "$BTN_REF" ]; then
  echo "ERROR: Could not find form fields"
  exit 1
fi

# Fill the form
agent-browser fill @$PHONE_REF "$PHONE" 2>&1 | tail -1
agent-browser fill @$NAME_REF "$NAME" 2>&1 | tail -1
agent-browser fill @$PIN_REF "$PIN" 2>&1 | tail -1
agent-browser click @$SWITCH_REF 2>&1 | tail -1
sleep 1
agent-browser click @$BTN_REF 2>&1 | tail -1
agent-browser wait 5000 2>&1 | tail -1

# Pick Grade 12 + Natural + Continue (re-snapshot each time for fresh refs)
agent-browser snapshot -i 2>&1 > /tmp/snap2.txt
G12=$(grep 'radio "Grade 12"' /tmp/snap2.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
if [ -n "$G12" ]; then
  agent-browser click @$G12 2>&1 | tail -1
  sleep 1
fi

agent-browser snapshot -i 2>&1 > /tmp/snap3.txt
NAT=$(grep 'radio "Natural science' /tmp/snap3.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
if [ -n "$NAT" ]; then
  agent-browser click @$NAT 2>&1 | tail -1
  sleep 1
fi

agent-browser snapshot -i 2>&1 > /tmp/snap4.txt
CONT=$(grep 'button "Continue"' /tmp/snap4.txt | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
if [ -n "$CONT" ]; then
  agent-browser click @$CONT 2>&1 | tail -1
fi

agent-browser wait 5000 2>&1 | tail -1
URL=$(agent-browser get url 2>&1 | tail -1)
echo "After onboarding: $URL"

# Save session
agent-browser state save "$SESSION_FILE" 2>&1 | tail -1
echo "Phone: $PHONE" > "$ACCOUNT_FILE"
echo "PIN: $PIN" >> "$ACCOUNT_FILE"
echo "Name: $NAME" >> "$ACCOUNT_FILE"
echo ""
echo "Account $NUM created: phone=$PHONE, session=$SESSION_FILE"
